import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { generate } from 'random-words'

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

interface ChatMsg {
    text: string
    sender: string
}

let chats: ChatMsg[] = []

app.get('/api/chats', (_, res) => {
    res.json(chats)
})

app.post('/api/chat', (req, res) => {
    chats.push({
        sender: 'You',
        text: req.body.msg as string,
    })


    chats.push({
        sender: 'SVC',
        text: generate() as string,
    })

    res.json(chats)
})

app.listen(8080, () => {
    console.log('Server running on port 8080')
})
