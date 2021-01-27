# React Rasa Assistant

React hook for easily building custom Rasa assistants.


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
                            key={btn.payload}
                            onClick={() =>
                                selectOption(btn.title, btn.payload, msgIdx)}
                        >
                            {btn.title}
                        </button>
                    )}
                </div>

            // Also handle any other custom properties (if any)
        })}

        <input
            value={userText}
            onChange={e => setUserText(e.target.value)}
            ref={onInputRef}
        />
        <button onClick={sendUserText}>Send</button>

        <br /><button onClick={restartSession}>Restart</button>
    </>
}
```


Handle custom responses:


```js
const Assistant = () => {
    const {
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

    const {
        msgHistory, onInputRef, userText, setUserText,
        sendUserText, selectOption, botUtter, restartSession,
    }
        = useBot({sockUrl, sockOpts, initSessionId, initMsg, onError, onUtter})


### Expected config object

- `sockUrl`: Full socket URL

- `sockOpts`: Advanced socket options. See
  [here](https://socket.io/docs/v2/client-api/#new-Manager-url-options)
  for a full reference.

- `initSessionId`: An optional session id that may be used to
  continue a previous session.

- `initMsg`: An optional text to be sent in the beginning of the
  conversation.

- `onError(error)`: An optional handler that gets called each time
  the socket emits an error. Error object schema:

  - `type`: Name of the socket socket error event
  - `payload`: The error object exactly as emitted by the socket

- `onUtter(msg)`: An optional handler that is called for each
  message sent / received. See the details of the message object
  at the end of the section.


### Returned object

- `msgHistory`: An array of message objects. See the details of
  the message object at the end of the section.

- `onInputRef(el)`: [A standard React ref
  callback](https://reactjs.org/docs/refs-and-the-dom.html#callback-refs)
  that expects the native input element as its sole parameter.
  Passing the ref this way to the library allows it to handle
  behavior such as auto focusing and blurring. If this is not
  something you want, just don't use this and handle those
  behaviors yourself the way you want.

- `userText`: The current value of the text that has not yet been
  sent.

- `setUserText(text)`: Setter method for `userText` above.

- `sendUserText()`: Send the current `userText` to the assistant
  and empty its value.

- `selectOption(title, payload, msgIdx)`: Select an option provided
  by a message with the `buttons` or `quick_replies` property.
  Args:

  - `title`: The title of the button

  - `payload`: The payload (intent) of the button

  - `msgIdx`: The index of the message that this button is a part
    of. This is required as in the case of quick replies, the
    button group is removed after an option is selected.

- `botUtter(msg)`: Send a message from the bot, as if it was the
  bot talking. This is intended to be used to handle custom
  responses. See the details of the message object, which is the
  only parameter, at the end of the section.

- `restartSession()`: Clear the message history and restart the
  session.


### The message object:

- `ts`: Message timestamp

- `direction`: Either `in` (for "incoming") or `out` (for
"outgoing")

- `text`: The message text. Optional

- `buttons`: A list of button objects. Optional. Button object
  schema:

  - `title`: The button title
  - `payload`: The button payload. Should be a valid Rasa intent.

- `quick_replies`: A list of button objects. Optional Quick
  replies only differ from buttons with their ability of
  disappearing after being clicked on. Button object schema:

  - `title`: The button title
  - `payload`: The button payload. Should be a valid Rasa intent.

- `metadata`: Potential metadata as sent by Rasa. Optional

In case of a custom response, custom properties matching the ones
in the custom response will exist as well.


## Gotchas

In React Native the `transports` socket option needs to be
explicitly provided with the value `['websocket']`:

    useBot({
        sockUrl: '<your socket url>',
        sockOpts: {transports: ['websocket']},
        ...
    }))

The reason for this is that the default value for that option is
`['polling', 'websocket']` but `polling` isn't supported on React
Native. The Socket.io client doesn't automatically switch to
Websocket connection if polling is failing, so this must be
explicitly configured.
