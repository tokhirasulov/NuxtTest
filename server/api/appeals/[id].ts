export default defineEventHandler(async (event) => {
  if (event.method === 'DELETE') {
    const id = event.context.params?.id
    if (!id) {
      return createError({
        statusCode: 400,
        message: 'Missing appeal ID'
      })
    }

    // In a real application, you would delete from a database
    // For now, we'll just return a success response
    return {
      success: true,
      message: `Appeal ${id} deleted successfully`
    }
  }

  return createError({
    statusCode: 405,
    message: 'Method not allowed'
  })
})
