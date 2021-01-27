const
    io = require('socket.io-client'),
    {useState, useEffect, useCallback, useRef} = require('react')


module.exports = ({
    sockUrl,
    sockOpts,
    initSessionId,
    initMsg,
    onError = noop,
    onUtter = noop,
}) => {
    const
        sockRef = useRef(null),
        sessionIdRef = useRef(null),
        inputRef = useRef({focus: noop, blur: noop}),

        [userText, setUserText] = useState(''),

        [msgHistory, setMsgHistory] = useState([]),

        pushMsgToHistory = useCallback(
            msg =>
                setMsgHistory(lastMsgHistory => [...lastMsgHistory, msg]),
        ),

        removeMsgFromHistory = useCallback(
            msgIdx =>
                setMsgHistory(lastMsgHistory => [
                    ...lastMsgHistory.slice(0, msgIdx),
                    ...lastMsgHistory.slice(msgIdx + 1),
                ])),

        restartSession = useCallback(
            (sock, session_id) =>
                sockRef.current.emit('session_request', {session_id}),
        ),

        userUtter = useCallback(
            (text, payload) => {
                sockRef.current.emit('user_uttered', {
                    session_id: sessionIdRef.current,
                    message: payload || text,
                })

                const msg = {ts: Date.now(), direction: 'out', text}

                onUtter(msg)
                pushMsgToHistory(msg)
            },

            [sockRef.current, sessionIdRef.current],
        ),

        sendUserText = useCallback(
            () => {
                userUtter(userText)
                setUserText('')
            },

            [userText],
        ),

        selectOption = useCallback(
            (title, payload, msgIdx) => {
                userUtter(title, payload)

                inputRef.current.focus()

                if (msgHistory[msgIdx].quick_replies)
                    removeMsgFromHistory(msgIdx)
            }
        ),

        handleBotUtter = useCallback(
            msg => {
                const
                    {text, quick_replies, buttons} = msg,

                    msgTpl = {
                        ts: Date.now(),
                        direction: 'in',
                        metadata: msg.metadata,
                    }

                onUtter({...msgTpl, ...msg})

                if (text)
                    pushMsgToHistory({...msgTpl, text})

                if (quick_replies)
                    pushMsgToHistory({...msgTpl, quick_replies})

                if (buttons)
                    pushMsgToHistory({...msgTpl, buttons})

                if (!text && !quick_replies && !buttons)
                    pushMsgToHistory({...msgTpl, ...msg})

                if (quick_replies || buttons)
                    inputRef.current.blur()
            })

    useEffect(() => {
        const
            [, sockHostname, sockPath] =
                sockUrl.match(/^((?:http|ws)s?:\/\/[^/]+)(\/.*)$/),

            sock = io(sockHostname, {path: sockPath, ...sockOpts})

        sockRef.current = sock

        socketErrorEventNames
            .forEach(errorEventName =>
                sock.on(errorEventName, e =>
                    onError({type: errorEventName, payload: e})))

        sock
            .on('connect', () => restartSession(sock, initSessionId))

            .on('session_confirm', sessInfo => {
                sessionIdRef.current = sessInfo.session_id

                setMsgHistory([])

                inputRef.current.focus()

                if (initMsg)
                    userUtter(initMsg)
            })

            .on('bot_uttered', handleBotUtter)
    }, [])

    return {
        msgHistory,
        onInputRef: el => { inputRef.current = el },
        userText,
        setUserText,
        sendUserText,
        selectOption,
        botUtter: handleBotUtter,
        restartSession,
    }
}

const noop = () => null

const socketErrorEventNames = [
    'error', 'connect_error', 'connect_timeout', 'reconnect_error',
    'reconnect_failed', 'disconnect',
]
