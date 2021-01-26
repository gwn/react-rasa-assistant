const
    debug = require('debug')('ixo-assistant-ui-lite'),
    io = require('socket.io-client'),
    {createElement: e, Fragment, useState, useEffect, useCallback, useRef}
        = require('react')


const defaultComponents = {
    TextMessage: ({direction, text}) =>
        e('div', null, {in: '<', out: '>'}[direction] + ' ' + text),

    Button: props => e('button', props),

    Input: ({onRef, onChangeText, onEnter, ...props}) =>
        e('input', {
            ...props,
            ref: onRef,
            onChange: e => onChangeText(e.target.value),
            onKeyDown: e => e.key === 'Enter' && onEnter(),
        }),

    Template: ({msgHistory, input, sendButton, restartButton}) =>
        e(Fragment, {}, msgHistory, input, sendButton, restartButton),
}

module.exports = ({
    rasaSocket,
    initialSessionId,
    initialMessage,
    onUtter = noop,
    onCustomResponse = noop,
    onError = noop,
    components: {
        TextMessage = defaultComponents.TextMessage,
        OptButton = defaultComponents.Button,
        SendButton = defaultComponents.Button,
        RestartButton = defaultComponents.Button,
        Input = defaultComponents.Input,
        Template = defaultComponents.Template,
    } = defaultComponents,
}) => {
    const
        sockRef = useRef(null),
        sessionIdRef = useRef(null),
        inputRef = useRef({focus: noop, blur: noop}),

        [msgDraft, setMsgDraft] = useState(''),

        [msgHistory, setMsgHistory] = useState([]),

        pushMsgToHistory = useCallback(
            msg => {
                const fullMsg = {ts: Date.now(), ...msg}

                setMsgHistory(lastMsgHistory => [...lastMsgHistory, fullMsg])
                onUtter(fullMsg)
            },

            [onUtter],
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
                debug('sending msg', {text, payload})

                sockRef.current.emit('user_uttered', {
                    session_id: sessionIdRef.current,
                    message: payload || text,
                })

                pushMsgToHistory({direction: 'out', text})
            },

            [sockRef.current, sessionIdRef.current],
        ),

        sendMsg = useCallback(
            () => {
                userUtter(msgDraft)
                setMsgDraft('')
            },

            [msgDraft],
        ),

        handleBotUtter = useCallback(
            msg => {
                debug('bot_uttered', msg)

                if (msg.text)
                    pushMsgToHistory({direction: 'in', text: msg.text})

                if (msg.quick_replies)
                    pushMsgToHistory({
                        direction: 'in', quick_replies: msg.quick_replies})

                if (msg.buttons)
                    pushMsgToHistory({direction: 'in', buttons: msg.buttons})

                if (msg.quick_replies || msg.buttons)
                    inputRef.current.blur()

                if (!msg.text && !msg.quick_replies && !msg.buttons)
                    onCustomResponse(msg, handleBotUtter)
            })

    useEffect(() => {
        const
            {url: sockUrl, ...sockOpts} = rasaSocket,
            sock = io(sockUrl, sockOpts)

        sockRef.current = sock

        sock
            .on('connect', () => restartSession(sock, initialSessionId))

            .on('connect_error', e => {
                debug('connect_error', e)
                onError(e)
            })

            .on('disconnect', e => console.info('disconnect', e))

            .on('session_confirm', sessInfo => {
                debug('session confirmed', sessInfo)

                sessionIdRef.current = sessInfo.session_id

                setMsgHistory([])

                inputRef.current.focus()

                if (initialMessage)
                    userUtter(initialMessage)
            })

            .on('bot_uttered', handleBotUtter)

            .on('error', e => {
                debug('error', e)
                onError(e)
            })
    }, [])

    return e(Template, {
        msgHistory: msgHistory.map((msg, msgIdx) => {
            if (msg.text)
                return e(TextMessage, {key: msg.ts, ...msg})

            if ((msg.quick_replies || msg.buttons))
                return (msg.quick_replies || msg.buttons).map(btn =>
                    e(OptButton, {
                        key: msg.ts + btn.payload,
                        children: btn.title,
                        onClick: () => {
                            userUtter(btn.title, btn.payload)
                            inputRef.current.focus()

                            if (msg.quick_replies)
                                removeMsgFromHistory(msgIdx)
                        },
                    }),
                )

            if (msg.component)
                return e(Fragment, {key: msg.ts, children: msg.component})
        }),

        input: e(Input, {
            value: msgDraft,
            onChangeText: setMsgDraft,
            onEnter: sendMsg,
            onRef: el => { inputRef.current = el },
        }),

        sendButton: e(SendButton, {
            onClick: sendMsg,
            children: 'Send',
        }),

        restartButton: e(RestartButton, {
            onClick: restartSession,
            children: 'Restart',
        }),
    })
}

const noop = () => null
