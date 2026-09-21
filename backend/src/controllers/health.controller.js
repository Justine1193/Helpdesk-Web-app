export function getHealth(_request, response) {
  response.json({
    status: 'ok',
    service: 'helpdesk-pro-backend',
    timestamp: new Date().toISOString(),
  })
}
