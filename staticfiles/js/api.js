 export const SITE = "http://localhost:8000";
//export const SITE = "https://nidjatstore.ru";

export const sendFetchPost = (page, body, funcs) => {
    fetch(`${SITE}/api/${page}`, {
        method: "POST",
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(res => res.json())
        .then(responseJson => { funcs(responseJson) });
}

export const sendFetchPostWithAccess = (page, access, body, funcs) => {
    fetch(`${SITE}/api/v1/${page}`, {
        method: "POST",
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`,
        },
        body: JSON.stringify(body)
    }).then(res => res.json())
        .then(responseJson => { funcs(responseJson) });
}

export const sendFetchGet = (page, access, funcs) => {
    fetch(`${SITE}/api/v1/${page}`, {
        method: "GET",
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`
        },
    }).then(res => res.json())
        .then(responseJson => { funcs(responseJson) });
}

export const sendFetchPut = (page, access, body, funcs) => {
    fetch(`${SITE}/api/v1/${page}`, {
        method: "PUT",
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`
        },
        body: JSON.stringify(body)
    }).then(res => res.json())
        .then(responseJson => { funcs(responseJson) });
}

export const sendFetchPostFile = (page, access, body, funcs) => {
    fetch(`${SITE}/api/v1/${page}`, {
        method: "POST",
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${access}`,
        },
        body: body,
    }).then(res => res.json())
        .then(responseJson => { funcs(responseJson) });
}