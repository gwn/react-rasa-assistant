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
            rasaUrl='http(s)://address/of/your/rasa/service'
            sender='<some kind of unique user identifier>'
            initialMessage='Hello dear ixobot'
        />


Customize components:

    const
        React = require('react'),
        IxoAssistant = require('@ixo/assistant-ui-lite')

    const component = () =>
        <IxoAssistant
            rasaUrl='http(s)://address/of/your/rasa/service'
            sender='<some kind of unique user identifier>'
            initialMessage='Hello dear ixobot'
            components={{
                TextMessage: ({ts, direction, text}) =>
                    <div class="ixo-assistant-msg">
                        <span class="sender">
                            {{in: 'Assistant', out: 'Me'}[direction]}</span>
                        <span class="timestamp">{ts}</span>
                        <span class="text">{text}</span>
                    </div>,

                Button: ({children, onClick}) =>
                    <button
                        class="ixo-assistant-btn"
                        onClick={onClick}
                    >
                        {children}
                    </button>,

                Input: ({value, onChange}) =>
                    <input
                        class="ixo-assistant-msg-input"
                        value={value}
                        onChange={onChange}
                    />,
            }}
        />


Use in React Native:

    const
        React = require('react'),
        {Text, TextInput, TouchableHighlight} = require('react-native'),
        IxoAssistant = require('@ixo/assistant-ui-lite')

    <IxoAssistant
        rasaUrl='http(s)://address/of/your/rasa/service'
        sender='<some kind of unique user identifier>'
        initialMessage='Hello dear ixobot'
        components={{
            TextMessage: ({direction, text}) =>
                <Text>{{in: '<', out: '>'}[direction]} {text}</Text>,

            Button: ({children, onClick}) =>
                <TouchableHighlight onPress={onClick}>
                    <Text>{children}</Text>
                </TouchableHighlight>,

            Input: ({value, onChange}) =>
                <TextInput defaultValue={value} onChangeText={onChange} />,
        }}
    />


Handle custom responses:

    const
        React = require('react'),
        IxoAssistant = require('@ixo/assistant-ui-lite')

    const component = () =>
        <IxoAssistant
            rasaUrl='http(s)://address/of/your/rasa/service'
            sender='<some kind of unique user identifier>'
            initialMessage='Hello dear ixobot'
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
            rasaUrl='http(s)://address/of/your/rasa/service'
            sender='<some kind of unique user identifier>'
            initialMessage='Hello dear ixobot'
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
                        buttons: [
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
            rasaUrl='http(s)://address/of/your/rasa/service'
            sender='<some kind of unique user identifier>'
            initialMessage='Hello dear ixobot'
            onCustomResponse=(resp, pushMsgToHistory) => {
                const
                    [actionCategory, actionId] = resp.action.split('.'),
                    handler = handlers[actionCategory][actionId]

                if (!handler)
                    return console.warn(
                        'Handler not found for returned action:', resp.action)

                const msgs = handler()

                msgs.forEach(msg =>
                    pushMsgToHistory({direction: 'in', ...msg}))
            }
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

                {buttons: [
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

- `rasaUrl`: REST webhook URL for the rasa service

- `sender`: A unique user id

- `initialMessage`: The message that will start the conversation

- `onCustomResponse`: A handler for the custom responses returned from Rasa

      onCustomResponse(resp, pushMsgToHistory)

  - `resp`: The parsed custom response object exactly as returned from Rasa

  - `pushMsgToHistory(msg)`: A function that pushes the given
    message to the message history. A message is an object with
    a `direction` and one of the `text`, `buttons` or `component`
    properties:

      - `direction`: Either `in` (for "incoming") or `out` (for
        "outgoing"

      - `text`: The message text

      - `buttons`: A list of button objects. Button object schema:

        - `title`: The button title
        - `payload`: The button payload. Should be a valid Rasa intent.

      - `component`: Any custom component

- `components`: Components to customize the look of the assistant.
  Can also be used to integrate the assistant to the platforms
  other than the web. An object with the following keys:

  - `TextMessage`: A custom component that will be sent the
    following props:

      - `direction`: The message direction, either `in` or `out`
      - `text`: The message text

  - `Button`: A custom component that will be sent the following
    props:

    - `children`: The button's content
    - `onClick`: Standard click handler

  - `Input`: A custom component that will be sent the following
    props:

    - `value`: Input value
    - `onChange`: Standard change handler
