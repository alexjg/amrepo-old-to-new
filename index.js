// @ts-check
import fs from "fs"
import express from "express"
import { WebSocketServer } from "ws"
import { parseAutomergeUrl, isValidAutomergeUrl, Repo} from "@automerge/automerge-repo"
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import os from "os"
import * as uuid from "uuid"
import { uuidToUrl } from "./translateDocId.js"
import { TranslatingClientAdapter } from "./TranslatingWebSocketClient.js"

export class Server {
  /** @type WebSocketServer */
  #socket

  /** @type ReturnType<import("express").Express["listen"]> */
  #server

  /** @type {((value: any) => void)[]} */
  #readyResolvers = []

  #isReady = false

  #repo

  constructor() {
    const dir = "data"
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    var hostname = os.hostname()

    this.#socket = new WebSocketServer({ noServer: true })

    const PORT =
      process.env.PORT !== undefined ? parseInt(process.env.PORT) : 3040
    const app = express()
    app.use(express.static("public"))

    const config = {
      network: [new TranslatingClientAdapter("ws://localhost:3030")],
      storage: new NodeFSStorageAdapter(dir),
      /** @ts-ignore @type {(import("@automerge/automerge-repo").PeerId)}  */
      peerId: `second-storage-server-${hostname}`,
      // Since this is a server, we don't share generously — meaning we only sync documents they already
      // know about and can ask for by ID.
      sharePolicy: async () => false,
    }
    const serverRepo = new Repo(config)
    this.repo = serverRepo

    app.get("/", (req, res) => {
      res.send(`👍 @automerge/example-sync-server is running`)
    })

    this.#server = app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`)
      this.#isReady = true
      this.#readyResolvers.forEach((resolve) => resolve(true))
    })

    this.#server.on("upgrade", (request, socket, head) => {
      this.#socket.handleUpgrade(request, socket, head, (socket) => {
        this.#socket.emit("connection", socket, request)
      })
    })
  }

  async ready() {
    if (this.#isReady) {
      return true
    }

    return new Promise((resolve) => {
      this.#readyResolvers.push(resolve)
    })
  }

  close() {
    this.#socket.close()
    this.#server.close()
  }
}

function oldDocIds(oldDir) {
    const oldDocs = fs.readdirSync(oldDir)
    return oldDocs.map((doc) => doc.split(".")[0])
}
const oldDocs = oldDocIds("../old/packages/automerge-repo-sync-server/.amrg")
const server = new Server()

for (const docId of oldDocs) {
    const url = uuidToUrl(docId)
    server.repo.find(url)
}

