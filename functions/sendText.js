const axios = require('axios');

async function sendText(contact_id, chat_template_id, token, message, sendTemplate) {
    const config = {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        params: {
            token
        }
    }
    const templateArr = {
        contact_id,
        message: 'test',
        direction: 'outbound',
        chat_template_id,
        media_type: 'text'
    }

    const freeBodyArr = {
        contact_id,
        message,
        direction: 'outbound',
        media_type: 'text',
    }

    const url = process.env.SEND_TEXT_URL;
    
    if(sendTemplate) {
        const templateData = await axios.post(url,templateArr,config)

        return templateData.data
    } else {
        const freeBody = await axios.post(url,freeBodyArr,config)

        return freeBody.data
    }
}

module.exports = {sendText}