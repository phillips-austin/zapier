const axios = require('axios');

async function sendText(contact_id, chat_template_id, token) {
    const config = {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        params: {
            token
        }
    }
    const arr = {
        contact_id,
        message: 'test',
        direction: 'outbound',
        chat_template_id,
        media_type: 'text'
    }
    const url = process.env.SEND_TEXT_URL;
    const data = await axios.post(url,arr,config)
    return data.data
}

module.exports = {sendText}