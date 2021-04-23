const axios = require('axios');

async function sendText(contact_id, chat_template_id, token, message, sendTemplate, direction) {
    const freeBodyConfig = {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        params: {
            token,
            token,
            contact_id,
            message: 'filler',
            media_type: 'text',
            direction
        }
    }

    const templateConfig = {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        params: {
            token,
            contact_id,
            chat_template_id,
            message,
            media_type: 'text',
            direction
        }
    }

    const url = process.env.SEND_TEXT_URL;
    
    if(sendTemplate) {
        const templateData = await axios.post(url,null,templateConfig)

        return templateData.data
    } else {
        const freeBody = await axios.post(url,null,freeBodyConfig)

        return freeBody.data
    }
}

module.exports = {sendText}