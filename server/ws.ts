import { Server } from 'socket.io'
import { generate } from 'random-words'

interface ChatMsg {
    text: string
    sender: string
}

let chats: ChatMsg[] = []

const io = new Server({
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
})

io.on('connection', socket => {
    console.log('connected')

    socket.on('chat', (msg: string) => {
        console.log(msg, '<<<')
        chats.push({
            sender: 'You',
            text: msg
        })
    
        chats.push({
            sender: 'SVC',
            text: generate() as string
        })
    
        io.emit('chats', chats)
    })
})

io.listen(8080)
