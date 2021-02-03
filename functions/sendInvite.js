const axios = require('axios');
const moment = require('moment');

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}

// Get existing contact by the email that is used
async function getContactByEmail(email, token, locations, campaign_id, how, date, hour, minute, ampm, response) {
    const url = process.env.CONTACTS_URL;
    const arr = {
        params: {
            token,
            email        
        }
    }
    const data = await axios.get(url, arr, config)
    return(data.data)
}

// Get existing contact by the phone that is used
async function getContactByPhone(phone, token, locations, campaign_id, how, date, hour, minute, ampm, response) {
    const url = process.env.CONTACTS_URL;
    const arr = {
        params: {
            token,
            phone        
        }
    }
    const data = await axios.get(url, arr, config)
    return(data.data)
}

// Create Invite
async function sendInvite(contact_id, token, location_id, campaign_id) {
    const url = process.env.INVITES_URL;
    const arr = {
        token,
        location_id,
        contact_id,
        campaign_id,
        scheduled: false
    };
    const invite = await axios.post(url, arr, config)
    return({invite: invite.data})
}

async function sendInviteScheduled(contact_id, token, location_id, campaign_id, how, date, hour, minute, ampm, response) {
    if (date) {
        const scheduleInviteFunction = await scheduleInvite(contact_id, token, location_id, campaign_id, how, date, hour, minute, ampm, response)
        return({data: scheduleInviteFunction})
    } else {
        const sendToday = await sendTodayAtTime(contact_id, token, location_id, campaign_id, date, hour, minute, ampm, response)
        return({data: sendToday})
    }
}

scheduleInviteExample = (contact_id, token, location_id, campaign_id, how, date, hour, minute, ampm, response) => {
    const url = process.env.INVITES_URL;
    const dateConverted = new Date(date)
    const year = dateConverted.getFullYear()
    const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
    const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
    const hourConverted = () => {
        if (hour === 12) {
            return hour;
        } else {
            if (ampm === 'AM') {
                if (hour > 9) {
                    return hour;
                } else {
                    return `0${hour}`;
                }
            } else if (ampm === 'PM') {
                return hour + 12;
            }
        }
    }
    var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    now = new Date(now)
    const scheduleDate = `${year}-${month}-${day} ${hourConverted()}:${minute}`;

    if (new Date(now).getTime() > new Date(scheduleDate).getTime()) {
        function addZero(n){
            if (n <= 9) {
                return '0' + n
            }
              return n
        }
        var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
        now = new Date(now);
        var nextDay = new Date(now)
        nextDay.setDate(now.getDate() + 1)
        const tomorrow = new Date(nextDay)
        const tomorrowFormatted = tomorrow.getFullYear() + '-' + addZero(tomorrow.getMonth() + 1) + '-' + addZero(tomorrow.getDate()) + ' ' + hourConverted() + ':' + minute;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: tomorrowFormatted
        };
        console.log(arr)
        // return(
        //     axios.post(url, arr, config)
        //     .then(res => {
        //         return(res.data)
        //     })
        //     .catch(err => {
        //         if (err.response.data.contact_id) {
        //             return({message: err.response.data.message})
        //         } else {
        //             return({message: err.response.data.message})
        //         }
        //     })
        // )
    } else {
        const dateConverted = new Date(date)
        const year = dateConverted.getFullYear()
        const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
        const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
        const hourConverted = () => {
            if (hour === 12) {
                return hour;
            } else {
                if (ampm === 'AM') {
                    if (hour > 9) {
                        return hour;
                    } else {
                        return `0${hour}`;
                    }
                } else if (ampm === 'PM') {
                    return hour + 12;
                }
            }
        }
        const scheduleDate = `${year}-${month}-${day} ${hourConverted()}:${minute}`;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: scheduleDate
        };
        console.log(arr)


        // return (
        //     axios.post(url, arr, config)
        //     .then(res => {
        //         return(res.data)
        //     })
        //     .catch(err => {
        //         if (err.response.data.contact_id) {
        //             return({message: err.response.data.message})
        //         } else {
        //             return({message: err.response.data.message})
        //         }
        //     })
        // )
    }
}

scheduleInvite = (contact_id, token, location_id, campaign_id, how, date, hour, minute, ampm, response) => {
    const url = process.env.INVITES_URL;
    const dateConverted = new Date(date)
    const year = dateConverted.getFullYear()
    const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
    const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
    const hourConverted = () => {
        if (hour === 12) {
            return hour;
        } else {
            if (ampm === 'AM') {
                if (hour > 9) {
                    return hour;
                } else {
                    return `0${hour}`;
                }
            } else if (ampm === 'PM') {
                return hour + 12;
            }
        }
    }
    var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    now = new Date(now)
    const scheduleDate = `${year}-${month}-${day} ${hourConverted()}:${minute}`;

    if (hour) {
        const dateConverted = new Date(date)
        const year = dateConverted.getFullYear()
        const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
        const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
        const hourConverted = () => {
            if (hour === 12) {
                return hour;
            } else {
                if (ampm === 'AM') {
                    if (hour > 9) {
                        return hour;
                    } else {
                        return `0${hour}`;
                    }
                } else if (ampm === 'PM') {
                    return hour + 12;
                }
            }
        }
        const scheduleDate = `${year}-${month}-${day} ${hourConverted()}:${minute}`;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: scheduleDate
        };

        return (
            axios.post(url, arr, config)
            .then(res => {
                return(res.data)
            })
            .catch(err => {
                if (err.response.data.contact_id) {
                    return({message: err.response.data.message})
                } else {
                    return({message: err.response.data.message})
                }
            })
        )
    } else {
        const dateConverted = new Date(date)
        const scheduleDate = moment(dateConverted).format("YYYY-MM-DD HH:mm");
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: scheduleDate
        };

        return (
            axios.post(url, arr, config)
            .then(res => {
                return(res.data)
            })
            .catch(err => {
                if (err.response.data.contact_id) {
                    return({message: err.response.data.message})
                } else {
                    return({message: err.response.data.message})
                }
            })
        )
    }
}


// Send invite Today

sendTodayAtTime = (contact_id, token, location_id, campaign_id, date, hour, minute, ampm, response) => {
    const dateConverted = new Date(date)
    const hourConverted = () => {
        if (hour === 12) {
            return hour;
        } else {
            if (ampm === 'AM') {
                if (hour > 9) {
                    return hour;
                } else {
                    return `0${hour}`;
                }
            } else if (ampm === 'PM') {
                return hour + 12;
            }
        }
    }
    function addZero(n){
        if (n <= 9) {
            return '0' + n
        }
          return n
    }
    var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    now = new Date(now)
    const todayScheduled = now.getFullYear() + '-' + addZero(now.getMonth() + 1) + '-' + addZero(now.getDate()) + ' ' + hourConverted() + ':' + minute;

    if (new Date(now).getTime() > new Date(todayScheduled).getTime()) {
        const url = process.env.INVITES_URL;
        function addZero(n){
            if (n <= 9) {
                return '0' + n
            }
              return n
        }
        var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
        now = new Date(now);
        var nextDay = new Date(now)
        nextDay.setDate(now.getDate() + 1)
        const tomorrow = new Date(nextDay)
        const tomorrowFormatted = tomorrow.getFullYear() + '-' + addZero(tomorrow.getMonth() + 1) + '-' + addZero(tomorrow.getDate()) + ' ' + hourConverted() + ':' + minute;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: tomorrowFormatted
        };
        return(
            axios.post(url, arr, config)
            .then(res => {
                return(res.data)
            })
            .catch(err => {
                if (err.response.data.contact_id) {
                    return({message: err.response.data.message})
                } else {
                    return({message: err.response.data.message})
                }
            })
        )
    } else {
        const url = process.env.INVITES_URL;
        function addZero(n){
            if (n <= 9) {
                return '0' + n
            }
              return n
        }
        const hourConverted = () => {
            if (hour === 12) {
                return hour;
            } else {
                if (ampm === 'AM') {
                    if (hour > 9) {
                        return hour;
                    } else {
                        return `0${hour}`;
                    }
                } else if (ampm === 'PM') {
                    return hour + 12;
                }
            }
        }
        var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
        now = new Date(now)
        const todayScheduled = now.getFullYear() + '-' + addZero(now.getMonth() + 1) + '-' + addZero(now.getDate()) + ' ' + hourConverted() + ':' + minute;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: todayScheduled
        };
        return(
            axios.post(url, arr, config)
            .then(res => {
                return(res.data)
            })
            .catch(err => {
                if (err.response.data.contact_id) {
                    return({message: err.response.data.message})
                } else {
                    return({message: err.response.data.message})
                }
            })
        )
    }

}

module.exports = {getContactByEmail, getContactByPhone, sendInvite, sendInviteScheduled}