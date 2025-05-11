import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (_, res) => {
  res.send('🚀 Hello from Node.js + TypeScript + Docker!')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
