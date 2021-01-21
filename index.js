const
    debug = require('debug')('ixo-assistant-ui-lite'),
    React = require('react'),
    {Fragment, useState, useEffect, useCallback} = React


const defaultComponents = {
    TextMessage: ({direction, text}) =>
        <div>{{in: '<', out: '>'}[direction]} {text}</div>,

    Button: props => <button {...props} />,

    Input: props => <input {...props} />,
}

module.exports = ({
    rasaUrl,
    sender,
    initialMessage,
    onCustomResponse,
    components: {
        TextMessage = defaultComponents.TextMessage,
        Button = defaultComponents.Button,
        Input = defaultComponents.Input,
    },
}) => {
    const
        [msgDraft, setMsgDraft] = useState(''),
        [msgHistory, setMsgHistory] =
            useState([{
                ts: Date.now(),
                direction: 'out',
                text: initialMessage,
            }])

    const pushMsgToHistory = useCallback(msg =>
        setMsgHistory(lastMsgHistory =>
            [...lastMsgHistory, {ts: Date.now(), ...msg}]))

    const removeMsgFromHistory = useCallback(msgIdx =>
        setMsgHistory(lastMsgHistory => [
            ...lastMsgHistory.slice(0, msgIdx),
            ...lastMsgHistory.slice(msgIdx + 1),
        ]))

    const msgAssistant = useCallback(async msg =>
        (await msgRasa(rasaUrl, sender, msg)).body.forEach(handleIncoming))

    const handleIncoming = useCallback(msg => {
        if (msg.text)
            pushMsgToHistory({direction: 'in', text: msg.text})

        if (msg.buttons)
            pushMsgToHistory({direction: 'in', buttons: msg.buttons})

        if (msg.custom)
            onCustomResponse(msg.custom, pushMsgToHistory)
    })

    useEffect(() => void msgAssistant(initialMessage), [])

    return <>
        {msgHistory.map((msg, msgIdx) => {
            if (msg.text)
                return <TextMessage key={msg.ts} {...msg} />

            if (msg.buttons)
                return msg.buttons.map(btn =>
                    <Button
                        key={msg.ts + btn.payload}
                        children={btn.title}
                        onClick={() => {
                            msgAssistant(btn.payload)
                            removeMsgFromHistory(msgIdx)
                            pushMsgToHistory({direction: 'out',text: btn.title})
                        }}
                    />)

            if (msg.component)
                return <Fragment key={msg.ts}>{msg.component}</Fragment>
        })}

        <Input value={msgDraft} onChange={setMsgDraft} />

        <Button
            onClick={() => {
                msgAssistant(msgDraft)
                pushMsgToHistory({direction: 'out', text: msgDraft})
                setMsgDraft('')
            }}
            children='Send'
        />
    </>
}

const msgRasa = async (rasaUrl, sender, message) => {
    const
        url = rasaUrl,
        opts = {
            method: 'POST',
            body: JSON.stringify({sender, message}),
        }

    debug('> Request', url, opts)

    const
        resp = await fetch(url, opts),
        body = await resp.json()

    debug('< Response', {status: resp.status, headers: resp.headers, body})

    return Promise[resp.ok ? 'resolve' : 'reject']({
        status: resp.status,
        headers: resp.headers,
        body,
    })
}
