# React Rasa Assistant

React hook for easily building custom Rasa Assistants.


## Install

    npm i react-rasa-assistant


## Usage

    import useBot from 'react-rasa-assistant'


## Examples

Basic:

```js
const Assistant = () => {
    const {
        msgHistory, onInputRef, userText, setUserText, sendUserText,
        selectOption, restartSession,
    } =
        useBot({sockUrl: '<your socket url>'})

    return <>
        {msgHistory.map((msg, msgIdx) => {
            if (msg.text)
                return <div key={msg.ts + '-txt'}>
                    {{in: '< ', out: '> '}[msg.direction]}
                    {msg.text}
                </div>

            if ((msg.quick_replies || msg.buttons))
                return <div key={msg.ts + '-btngroup'}>
                    {(msg.quick_replies || msg.buttons).map(btn =>
                        <button
                            children={btn.title}
                            onClick={() => selectOption(btn.title, btn.payload, msgIdx)}
                            key={btn.payload}
                        />
                    )}
                </div>

            // Also handle any other custom properties (if any)
        })}

        <input
            value={userText}
            onChange={e => setUserText(e.target.value)}
            ref={onInputRef}
        />
        <button children='Send' onClick={sendUserText} />

        <br /><button children='Restart' onClick={restartSession} />
    </>
}
```


Handle custom responses:


```js
const Assistant = () => {
    const {botUtter} =
        msgHistory, onInputRef, userText, setUserText, sendUserText,
        selectOption, botUtter, restartSession,
    } =
        useBot({
            sockUrl: '<your socket url>',
            onUtter: msg => {
                if (
                    msg.direction === 'in'
                    && !msg.text
                    && !msg.quick_replies
                    && !msg.buttons
                ) {
                    console.log('This is a custom message!', msg)

                    botUtter({text: 'I just sent you a custom message!'})
                }
            },
        })

    return ...
}
```


## API

- `sockUrl`: Full socket URL

- `sockOpts`: Advanced socket options. See
  [here](https://socket.io/docs/v2/client-api/#new-Manager-url-options)
  for a full reference.

- `initSessionId`: An optional session id that may be used to
  continue a previous session.

- `initMsg`: An optional message to be sent in the beginning of the
  conversation.

- `onError(error)`: An optional handler that gets called each time
  the socket emits an error.

- `onUtter(msg)`: An optional handler that is called for each
  message sent / received. Schema of the `msg` object:

  - `ts`: Message timestamp

  - `direction`: Either `in` (for "incoming") or `out` (for
    "outgoing"

  - `text`: The message text

  - `buttons`: A list of button objects. Button object schema:

    - `title`: The button title
    - `payload`: The button payload. Should be a valid Rasa intent.

  - `quick_replies`: A list of button objects. Quick replies
    only differ from buttons with their ability of
    disappearing after being clicked on. Button object schema:

    - `title`: The button title
    - `payload`: The button payload. Should be a valid Rasa intent.

  Other custom properties set by any custom responses may exist.


## Gotchas

In React Native the following socket option needs to be provided:

    useBot({
        sockUrl: '<your socket url>',
        sockOpts: {transports: ['websocket']},
        ...
    }))
