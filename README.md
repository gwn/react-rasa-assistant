# ixo-Assistant UI Lite

Lightweight user interface for the ixo-Assistant.


## Debugging

Enable debugging by including the item "ixo-assistant-ui-lite" in
your DEBUG environment variable. Example:

    DEBUG=foo,bar,ixo-assistant-ui-lite,baz

When enabled, the debug mode logs verbose output to the console,
such as detailed info about the API requests & responses exchanged
with the Rasa server.

See the ["debug" package on
NPM](https://www.npmjs.com/package/debug) for detailed info on
this approach.


## Examples

Basic example:

    const
        React = require('react'),
        IxoAssistant = require('@ixo/assistant-ui-lite')

    const component = () =>
        <IxoAssistant
            rasaSocket={{
                url: 'http(s)://address/of/your/rasa/socket',
                path: '/socketio',
            }}
            initialSessionId='<optional-session-id-to-continue-a-previous-session>'
            initialMessage='<optional initial message>'
            onError={e => console.error('Oh dear', e)}
        />


Customize components:

    const
        React = require('react'),
        IxoAssistant = require('@ixo/assistant-ui-lite')

    const component = () =>
        <IxoAssistant
            rasaSocket={{
                url: 'http(s)://address/of/your/rasa/socket',
                path: '/socketio',
            }}
            components={{
                TextMessage: ({ts, direction, text}) =>
                    <div class="ixo-assistant-msg">
                        <span class="sender">
                            {{in: 'Assistant', out: 'Me'}[direction]}</span>
                        <span class="timestamp">{ts}</span>
                        <span class="text">{text}</span>
                    </div>,

                OptButton: ({onClick, children}) =>
                    <button
                        class="ixo-assistant-opt-btn"
                        onClick={onClick}
                        children={children}
                    />,

                Input: ({value, onChangeText, onEnter, onRef}) =>
                    <input
                        class="ixo-assistant-msg-input"
                        value={value}
                        onChange={e => onChangeText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onEnter()}
                        ref={onRef}
                    />,

                SendButton: ({onClick}) =>
                    <button
                        class="ixo-assistant-send-btn"
                        onClick={onClick}
                        children='CLICK TO SEND!!!'
                    />,

                RestartButton: ({onClick}) =>
                    <button
                        class="ixo-assistant-restart-btn"
                        onClick={onClick}
                        children='Restart'
                    />,

                Template: ({msgHistory, input, sendButton, restartButton}) => <>
                    {msgHistory}

                    <div>
                        {input}
                        {sendButton}
                        {restartButton}
                    </div>
                </>,
            }}
        />


Use in React Native:

    const
        React = require('react'),
        {Text, TextInput, TouchableHighlight} = require('react-native'),
        IxoAssistant = require('@ixo/assistant-ui-lite')

    const Button = ({children, onClick}) =>
        <TouchableHighlight onPress={onClick}>
            <Text>{children}</Text>
        </TouchableHighlight>,

    const component = () =>
        <IxoAssistant
            rasaSocket={{
                url: 'http(s)://address/of/your/rasa/socket',
                path: '/socketio',
                transports: ['websocket'], // ATTENTION
            }}
            components={{
                TextMessage: ({ts, direction, text}) =>
                    <Text>{{in: '<', out: '>'}[direction]} {text}</Text>,

                OptButton: Button,
                SendButton: Button,
                RestartButton: Button,

                Input: ({value, onChangeText, onRef}) =>
                    <TextInput
                        defaultValue={value}
                        onChangeText={onChangeText}
                        ref={onRef}
                    />,
            }}
        />


Handle custom responses:

    const
        React = require('react'),
        IxoAssistant = require('@ixo/assistant-ui-lite')

    const component = () =>
        <IxoAssistant
            rasaSocket={{
                url: 'http(s)://address/of/your/rasa/socket',
                path: '/socketio',
            }}
            onCustomResponse={(customResp, pushMsgToHistory) => {
                if (customResp.action == 'dummy.sayNiceThings')
                    pushMsgToHistory({
                        direction: 'in',
                        text: 'unicorns rainbows flowers pizza',
                    })
            }}
        />


Handle custom responses: A more advanced example:

    const
        React = require('react'),
        IxoAssistant = require('@ixo/assistant-ui-lite'),
        QRCode = require('some-qr-code-package')

    const component = () => {
        const walletAddr = getWalletAddressSomehow()

        <IxoAssistant
            rasaSocket={{
                url: 'http(s)://address/of/your/rasa/socket',
                path: '/socketio',
            }}
            onCustomResponse={(customResp, pushMsgToHistory) => {
                if (customResp.action === 'wallet.printAddress')
                    pushMsgToHistory({direction: 'in', text: walletAddr})

                if (customResp.action === 'wallet.displayAddressQRCode') {
                    pushMsgToHistory({
                        direction: 'in',
                        text: 'See your QR code below:',
                    })

                    pushMsgToHistory({
                        direction: 'in',
                        component: <QRCode value={walletAddr} />,
                    })
                }

                if (customResp.action === 'wallet.askSomethingSilly') {
                    pushMsgToHistory({
                        direction: 'in',
                        text: 'Want to play with me?',
                    })

                    pushMsgToHistory({
                        direction: 'in',
                        quick_replies: [
                            {title: 'Yes', payload: '/basics.yes'},
                            {title: 'No', payload: '/basics.no'},
                        ]
                    })
                }
        />
    }


Handle custom responses: A framework example for elegantly dealing
with a large number of custom responses:

    const
        React = require('react'),
        IxoAssistant = require('@ixo/assistant-ui-lite'),
        QRCode = require('some-qr-code-package'),
        customResponseHandlers = require('./customResponseHandlers)

    const component = () =>
        <IxoAssistant
            rasaSocket={{
                url: 'http(s)://address/of/your/rasa/socket',
                path: '/socketio',
            }}
            onCustomResponse={(resp, pushMsgToHistory) => {
                const
                    [actionCategory, actionId] = resp.action.split('.'),
                    handler = handlers[actionCategory][actionId]

                if (!handler)
                    return console.warn(
                        'Handler not found for returned action:', resp.action)

                const msgs = handler()

                msgs.forEach(msg =>
                    pushMsgToHistory({direction: 'in', ...msg}))
            }}
        />

In `./customResponseHandlers.js`

    const
        React = require('react'),
        {Share} = require('react-native')

    module.exports = {
        dummy: {
            sayNiceThings: () => [{text: 'unicorns rainbows flowers pizza'}],
        },
        wallet: {
            printAddress: () => [{text: getWalletAddressSomehow()}],

            displayAddressQRCode: () => [
                {text: 'See your QR code below:'},
                {component: <QRCode value={getWalletAddressSomehow()} />},
            ],

            askSomethingSilly: () => [
                {text: 'Want to play with me?'},

                {quick_replies: [
                    {title: 'Yes', payload: '/basics.yes'},
                    {title: 'No', payload: '/basics.no'},
                ]},
            ],

            shareAddress: () => {
                Share.share({
                    message:
                        'Please send tokens to ' + getWalletAddressSomehow(),
                })

                return [{text: 'Ok I\'ve opened the sharing widget for you'}]
            },
        },
    }


## API

- `rasaSocket`: An object with the following properties:

    - `url`: URL of the socket
    - `path`: Path to the socket

  Plus any other properties that are accepted by the socket
  constructor method of the
  [`socket.io-client`](https://www.npmjs.com/package/socket.io-client)
  package.

- `initialSessionId`: An optional session id that may be used to
  continue a previous session.

- `initialMessage`: The message that will start the conversation. Optional.

- `onError`: A handler that gets called with an error object in
  case of socket errors.

- `onCustomResponse`: A handler for the custom responses returned from Rasa

      onCustomResponse(resp, pushMsgToHistory)

  - `resp`: The parsed custom response object exactly as returned from Rasa

  - `pushMsgToHistory(msg)`: A function that pushes the given
    message to the message history. A message is an object with a
    `direction` and one of the `text`, `buttons`, `quick_replies`
    or `component` properties:

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

      - `component`: Any custom component

- `components`: Components to customize the look of the assistant.
  Can also be used to integrate the assistant to the platforms
  other than the web. An object with the following keys:

  - `TextMessage`: Custom component for single messages

      - `ts`: Message timestamp
      - `direction`: The message direction, either `in` or `out`
      - `text`: The message text

  - `OptButton`: Custom component for the "quick reply" buttons

    - `children`: The button's content
    - `onClick`: Standard click handler

  - `SendButton`: Custom component for the message sending button

    - `children`: The button's content
    - `onClick`: Standard click handler

  - `RestartButton`: Custom component for the session restart button

    - `children`: The button's content
    - `onClick`: Standard click handler

  - `Input`: Custom component for the message input field

    - `value`: Input value

    - `onChangeText`: A function that expects the updated value of
      the input

    - `onEnter`: A function that is expected to be called when the
      enter key is pressed

    - `onRef`: [A React ref callback](https://reactjs.org/docs/refs-and-the-dom.html#callback-refs)
      that expects the underlying DOM element as its sole
      parameter. When a custom input is used, the ref needs to be
      captured this way, to enable the assistant UI library to
      handle behavior such as auto focusing.

  - `Template`: Template component that allows for free
    positioning of the other components

    - `msgHistory`: The message history part which contains all
      the individual messages

    - `input`: The new message input box

    - `sendButton`

    - `restartButton`
