import { sendFetchGet, sendFetchPost, sendFetchPostWithAccess } from "./api.js";

export const changeValue = (node, value, rubles) => {
    // Разбиваем число на тысячные с разделителем точкой
    const formattedNumber = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Определяем знак числа
    const sign = `text-${value >= 0 ? "success" : "danger"}`;
    // Добавляем знак и класс к узлу
    node.textContent = `${value >= 0 ? "+" : ""}${formattedNumber} ${!!rubles ? "рублей" : ""}`;
    node.classList.add(sign);
}

export const parseJwt = (token) => {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

export const getCookieValue = (name) => {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
}

export const checkTokens = async () => {
    checkExit();

    if (!getCookieValue("refresh")) {
        window.location = `${window.location.origin}/login`;
        return; // Остановить выполнение функции, если нет кука "refresh"
    }

    if (!getCookieValue("access") && getCookieValue("refresh")) {
        try {
            const data = await new Promise((resolve, reject) => {
                sendFetchPost(
                    "token/refresh",
                    {
                        "refresh": getCookieValue("refresh"),
                    },
                    (data) => {
                        resolve(data); // Разрешить промис с данными ответа
                    }
                );
            });

            if (data.detail) {
                window.location = `${window.location.origin}/login`
                return;
            } else {
                document.cookie = `access=${data.access}; path=/; max-age=3600`;
                document.cookie = `refresh=${data.refresh}; path=/; max-age=${3600 * 24 * 3}`;
            }
        } catch (error) {
            console.error("Ошибка при запросе обновления токенов:", error);
            // Можно добавить обработку ошибок, если необходимо
            window.location = `${window.location.origin}/login`
            return;
        }
    }
}

const checkExit = () => {
    const logoutBtn = document.querySelector("#logout");

    logoutBtn.addEventListener("click", () => {
        document.cookie = `access=; path=/; expires=-1`;
        document.cookie = `refresh=; path=/; expires=-1`;
    });
}

export const plugActivity = (state, name) => {
    const plug = document.querySelector(".plug");
    const loading = document.querySelector(".plug-loading");
    const plugTitle = document.querySelector(".plug-title");
    plug.classList[state ? "add" : "remove"]("active");

    if (state) {
        if (name === "loading") {
            loading.classList.add("active");
            plugTitle.classList.remove("active");
        } else {
            loading.classList.remove("active");
            plugTitle.classList.add("active");
        }
    }
}

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;

export const checkMobile = () => {
    const isVert = () => screen.orientation.type.includes("portrait");
    plugActivity(isVert());

    window.addEventListener("orientationchange", (() => {
        plugActivity(isVert());
    }));
}

const fetchPage = (name, curPage, limit, id) => {
    switch (name) {
        case 'transactions':
            return `transactions/${id}?offset=${(curPage - 1) * limit}&limit=${limit}`;
        case 'transactionsWithFiles':
            return `transactions/${id}?offset=${(curPage - 1) * limit}&limit=${limit}`;
        case 'transactions_types':
            const ids = JSON.parse(sessionStorage.getItem("transaction_id"));
            let responseTransactionLink = `transactions/?is_current_month=true&offset=${(curPage - 1) * limit}&limit=${limit}&`
        
            Array.from(ids).forEach((elem) => {
                responseTransactionLink += `types=${elem}&`;
            });

            return responseTransactionLink
        case 'customers':
            return window.location.hash === "#is_debtor" ?
                `users/customers?offset=${(curPage - 1) * limit}&limit=${limit}&is_debtor=true` :
                `users/customers?offset=${(curPage - 1) * limit}&limit=${limit}`;
        case 'definedCustomers':
            return window.location.hash === "#is_debtor" ?
                id ? 
                    `users/customers?name=${id}offset=${(curPage - 1) * limit}&limit=${limit}&is_debtor=true` :
                    `users/customers?offset=${(curPage - 1) * limit}&limit=${limit}&is_debtor=true` 
                :
                id ? 
                    `users/customers?name=${id}offset=${(curPage - 1) * limit}&limit=${limit}` :
                    `users/customers?offset=${(curPage - 1) * limit}&limit=${limit}`
    }
}

export const createPagination = (data, lines, changeFunc, fetch) => {
    const MAX_LINES = data.data.pagination.limit;
    const TOTAL = data.data.pagination.total;
    const pagination = document.querySelector(".pagination");
    let CURRENT_PAGE = 1;

    const createHtmlElems = (mainNode, text, maxPages) => {
        const li = document.createElement("li");
        li.classList.add("page-item");

        if (text === null) {
            const input = document.createElement("input");
            input.type = "number";
            input.min = 1;
            input.value = CURRENT_PAGE;
            input.max = maxPages;
            input.classList.add("page-link");
            li.appendChild(input);
        } else {
            const link = document.createElement("a");
            link.classList.add("page-link");

            const span = document.createElement("span");
            span.textContent = text;
            text === 1 && span.classList.add("text-success");

            link.appendChild(span);
            li.appendChild(link);
        }

        mainNode.appendChild(li);
    }

    if (TOTAL <= MAX_LINES) {
        pagination.style.display = "none";
    } else {
        pagination.style.display = "flex";
        const pages = Math.ceil(TOTAL / MAX_LINES);

        for (let i = 0; i < 3; i++) {
            if (i === 0) {
                createHtmlElems(pagination, "«");
            } else if (i === 2) {
                createHtmlElems(pagination, "»");
            } else {
                createHtmlElems(pagination, null, pages);
            }
        }

        const paginationLinks = pagination.querySelectorAll("li > a");
        const paginationInput = pagination.querySelector("input");

        const paginationActivity = (state) => {
            [...paginationLinks, paginationInput].forEach((elem) => {
                elem.style.opacity = state ? 1 : 0.5;
                elem.style.pointerEvents = state ? "auto" : "none";
            });
        };

        const handlePaginationClick = () => {
            paginationActivity(false);

            sendFetchGet(
                fetchPage(fetch, CURRENT_PAGE, MAX_LINES, data.id),
                getCookieValue("access"),
                (data) => {
                    if (data.errors.length > 0) {
                        alert(data.errors[0])
                    } else {
                        paginationInput.value = CURRENT_PAGE;

                        if (fetch !== "transactionsWithFiles") {
                            for (let i = 0; i < MAX_LINES; i++) {
                                if (i > data.data.items.length - 1) {
                                    lines[i].style.display = "none";
                                } else {
                                    lines[i].style.display = "table-row";
                                    changeFunc(lines[i], data.data.items[i]);
                                }
                            }

                            paginationActivity(true);
                        } else {
                            const arrId = [];
                            data.data.items.forEach((elem) => arrId.push(elem.id));
                            const transactions = data.data.items;

                            sendFetchPostWithAccess(
                                "receipts/", 
                                getCookieValue("access"),
                                {
                                    transaction_ids: arrId,
                                },
                                (data) => {
                                    if (data.errors.length > 0) {
                                        alert(data.errors[0])
                                    } else {
                                        for (let i = 0; i < MAX_LINES; i++) {
                                            if (i > transactions.length - 1) {
                                                lines[i].style.display = "none";
                                            } else {
                                                data.data.items.find((file) => {
                                                    if (file.transaction_id === transactions[i].id) {
                                                        transactions[i].file = file.file_path;
                                                    }
                                                })
                                                lines[i].style.display = "table-row";
                                                changeFunc(lines[i], transactions[i]);
                                            }
                                        }

                                        paginationActivity(true);
                                    }
                                }
                            )
                        }
                    }
                }
            )
        };

        paginationInput.addEventListener('keypress', function (e) {
            // если пользователь нажал на Enter
            if (e.which === 13) {
                if (
                    Number(paginationInput.value) >= Number(paginationInput.min) &&
                    Number(paginationInput.value) <= Number(paginationInput.max) &&
                    CURRENT_PAGE !== Number(paginationInput.value)
                ) {
                    CURRENT_PAGE = paginationInput.value;
                    handlePaginationClick();
                } else if (Number(paginationInput.value) < Number(paginationInput.min)) {
                    if (CURRENT_PAGE === Number(paginationInput.min)) {
                        paginationInput.value = paginationInput.min;
                    } else {
                        paginationInput.value = paginationInput.min;
                        CURRENT_PAGE = Number(paginationInput.value);
                        handlePaginationClick();
                    }

                } else if (Number(paginationInput.value) > Number(paginationInput.max)) {
                    if (CURRENT_PAGE === Number(paginationInput.max)) {
                        paginationInput.value = paginationInput.max;
                    } else {
                        paginationInput.value = paginationInput.max;
                        CURRENT_PAGE = Number(paginationInput.value);
                        handlePaginationClick();
                    }
                }
            }
        });

        paginationLinks.forEach((elem, i) => {
            elem.addEventListener("click", () => {
                if (i === 0) {
                    if (CURRENT_PAGE !== 1) {
                        CURRENT_PAGE--;
                        handlePaginationClick();
                    }
                } else {
                    if (CURRENT_PAGE !== pages) {
                        CURRENT_PAGE++;
                        handlePaginationClick();
                    }
                }
            });
        })
    }
}

export const deletePagination = () => {
    const pagination = document.querySelector(".pagination");
    Array.from(pagination.childNodes).forEach((elem) => elem.remove());
}

export const parseCurrency = (str) => {
    // Удаляем все точки и слова из строки
    let cleanedStr = str.replace(/[^\d]/g, '');
    // Преобразуем полученную строку в число
    return parseInt(cleanedStr, 10);
}