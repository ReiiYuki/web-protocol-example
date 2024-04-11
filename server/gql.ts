import express from 'express'
import { createHandler } from 'graphql-http/lib/use/express'
import { buildSchema } from 'graphql'
import { generate } from 'random-words'
import cors from 'cors'

interface ChatMsg {
    text: string
    sender: string
}

let chats: ChatMsg[] = []

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
    type ChatMsg {
        text: String!
        sender: String!
    }
    type Query {
        chats: [ChatMsg!]!
    }
    type Mutation {
        chat(msg: String!): [ChatMsg!]!
    }
`)

// The root provides a resolver function for each API endpoint
var root = {
    chats() {
        return chats
    },
    chat({ msg }) {
        chats.push({
            sender: 'You',
            text: msg
        })
        chats.push({
            sender: 'SVC',
            text: generate() as string
        })

        return chats
    },
}

var app = express()
app.use(cors())

// Create and use the GraphQL handler.
app.all(
  '/api/graphql',
  createHandler({
    schema: schema,
    rootValue: root,
  })
)

// Start the server at port
app.listen(8080, () => {
    console.log('Server running on port 8080')
})
