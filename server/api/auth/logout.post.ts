export default defineEventHandler((event) => {
  endSession(event)
  return { user: null }
})
