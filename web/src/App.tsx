import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { gql, GraphQLClient } from 'graphql-request'
import { io, Socket } from 'socket.io-client'

interface ChatMsg {
  text: string
  sender: string
}

interface ChatAppProps {
  chats: ChatMsg[]
  onChat: (msg: string) => void
  getChats?: () => void
  manualRefetch?: boolean
}

const ChatApp = ({ chats, onChat, manualRefetch, getChats }: ChatAppProps) => {
  const [msg, setMsg] = useState('')

  return (
    <div>
      {chats.map(({ sender, text }) => (
        <h6>{sender}: {text}</h6>
      ))}
      {manualRefetch && <button onClick={getChats}>Get Latest Msg</button>}
      <form onSubmit={e => {
        e.preventDefault()
        onChat(msg)
        setMsg('')
      }}>
        <input type="text" onChange={e => setMsg(e.target.value)} value={msg} />
      </form>
    </div>
  )
}

const Rest = () => {
  const { data = [], mutate } = useSWR<ChatMsg[]>(
    'http://localhost:8080/api/chats',
    (path: string) => fetch(path).then(res => res.json()),
    // {
    //   refreshInterval: 1000,
    // }
  )

  const { trigger } = useSWRMutation(
    'http://localhost:8080/api/chat',
    (path: string, { arg }: { arg: string }) =>
      fetch(path, {
        method: 'POST',
        body: JSON.stringify({ msg: arg }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
  )

  return (
    <ChatApp
      chats={data}
      manualRefetch
      getChats={() => { mutate()}}
      onChat={trigger}
    />
  )
}

const gqlClient = new GraphQLClient('http://localhost:8080/api/graphql')
const GQL = () => {
  const { data, mutate } = useSWR<{ chats: ChatMsg[]}>(
    gql`{
      chats {
        text
        sender
      }
    }`,
    (query: string) => gqlClient.request<{chats: ChatMsg[]}>(query),
    // {
    //   refreshInterval: 1000,
    // }
  )

  const { trigger } = useSWRMutation(
    gql`
    mutation Chat($msg: String!) {
      chat(msg: $msg) {
        text
        sender
      }
    }`,
    (query: string, { arg }: { arg: string }) => gqlClient.request<ChatMsg[]>(query, { msg: arg}),
  )

  return (
    <ChatApp
      chats={data?.chats || []}
      manualRefetch
      getChats={() => { mutate()}}
      onChat={trigger}
    />
  )
}

const WS = () => {
  const socketRef = useRef<Socket>()
  const [msg, setMsg] = useState<ChatMsg[]>([])

  useEffect(() => {
    const ioClient = io('http://localhost:8080')    

    ioClient.on('chats', (data: ChatMsg[]) => {
      setMsg(data)
    })

    socketRef.current = ioClient
  }, [])

  return (
    <ChatApp
      chats={msg}
      onChat={msg => {
        console.log('ccccc', msg, socketRef.current)
        socketRef.current?.emit('chat', msg)
      }}
    />
  )
}

const GRPC = () => {
  return <div>GRPC</div>
}

const MAPPER = {
  rest: Rest,
  gql: GQL,
  ws: WS,
  grpc: GRPC,
} as const

function App() {
  const [mode, setMode] = useState<keyof typeof MAPPER>('rest')
  const Comp = MAPPER[mode]

  return (
    <div>
      <section>
        <select onChange={e => setMode(e.target.value as keyof typeof MAPPER)} value={mode}>
          <option value="rest">RESTFul</option>
          <option value="gql">GraphQL</option>
          <option value="ws">Web Socket</option>
          <option value="grpc">GRPC</option>
        </select>
      </section>
      <section>
        {<Comp />}
      </section>
    </div>
  )
}

export default App
