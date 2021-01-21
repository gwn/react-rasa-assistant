const
    debug = require('debug')('ixo-assistant-ui-lite'),
    io = require('socket.io-client'),
    {createElement: e, Fragment, useState, useEffect, useCallback, useRef}
        = require('react')


const defaultComponents = {
    TextMessage: ({direction, text}) =>
        e('div', null, {in: '<', out: '>'}[direction] + ' ' + text),

    Button: props => e('button', props),

    Input: ({onChangeText, ...props}) =>
        e('input', {...props, onChange: e => onChangeText(e.target.value)}),
}

module.exports = ({
    rasaSocket,
    userId,
    initialSessionId,
    initialMessage,
    onCustomResponse = () => null,
    onError = () => null,
    components: {
        TextMessage = defaultComponents.TextMessage,
        Button = defaultComponents.Button,
        Input = defaultComponents.Input,
    } = defaultComponents,
}) => {
    const
        sockRef = useRef(null),
        sessionIdRef = useRef(null),

        [msgDraft, setMsgDraft] = useState(''),

        [msgHistory, setMsgHistory] = useState([]),

        pushMsgToHistory = useCallback(
            msg =>
                setMsgHistory(lastMsgHistory =>
                    [...lastMsgHistory, {ts: Date.now(), ...msg}])),

        removeMsgFromHistory = useCallback(
            msgIdx =>
                setMsgHistory(lastMsgHistory => [
                    ...lastMsgHistory.slice(0, msgIdx),
                    ...lastMsgHistory.slice(msgIdx + 1),
                ])),

        msgAssistant = useCallback(
            message => {
                debug('sending msg', message)

                sockRef.current.emit('user_uttered', {
                    session_id: sessionIdRef.current,
                    message,
                })
            },

            [sockRef.current, sessionIdRef.current],
        ),

        restartSession = useCallback(
            (sock, sessionId) =>
                sockRef.current.emit('session_request', {
                    session_id: sessionId || String(Date.now()) + userId,
                }),
        ),

        handleIncoming = useCallback(
            msg => {
                if (msg.text)
                    pushMsgToHistory({direction: 'in', text: msg.text})

                if (msg.quick_replies)
                    pushMsgToHistory({
                        direction: 'in', quick_replies: msg.quick_replies})

                if (msg.buttons)
                    pushMsgToHistory({direction: 'in', buttons: msg.buttons})

                if (!msg.text && !msg.quick_replies && !msg.buttons)
                    onCustomResponse(msg, pushMsgToHistory)
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

                if (initialMessage) {
                    msgAssistant(initialMessage)
                    pushMsgToHistory({direction: 'out', text: initialMessage})
                }
            })

            .on('bot_uttered', msg => {
                debug('bot_uttered', msg)
                handleIncoming(msg)
            })

            .on('error', e => {
                debug('error', e)
                onError(e)
            })
    }, [])

    return [
        ...msgHistory.map((msg, msgIdx) => {
            if (msg.text)
                return e(TextMessage, {key: msg.ts, ...msg})

            if ((msg.quick_replies || msg.buttons))
                return (msg.quick_replies || msg.buttons).map(btn =>
                    e(Button, {
                        key: msg.ts + btn.payload,
                        children: btn.title,
                        onClick: () => {
                            msgAssistant(btn.payload)
                            pushMsgToHistory({direction: 'out',text: btn.title})

                            if (msg.quick_replies)
                                removeMsgFromHistory(msgIdx)
                        },
                    })
                )

            if (msg.component)
                return e(Fragment, {key: msg.ts, children: msg.component})
        }),

        e(Input, {
            key: 'msgInput',
            value: msgDraft,
            onChangeText: setMsgDraft,
        }),

        e(Button, {
            key: 'sendBtn',
            onClick: () => {
                msgAssistant(msgDraft)
                pushMsgToHistory({direction: 'out', text: msgDraft})
                setMsgDraft('')
            },
            children: 'Send',
        }),

        e(Button, {
            key: 'restartBtn',
            onClick: restartSession,
            children: 'Restart',
        }),
    ]
}
