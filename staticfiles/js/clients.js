import { sendFetchGet, sendFetchPostWithAccess } from "./api.js";
import { checkTokens, getCookieValue, createPagination, changeValue, plugActivity, checkMobile, isMobile, deletePagination, parseJwt } from "./functions.js";

!function () { "use strict"; var e = document.querySelector(".sidebar"), t = document.querySelectorAll("#sidebarToggle, #sidebarToggleTop"); if (e) { e.querySelector(".collapse"); var o = [].slice.call(document.querySelectorAll(".sidebar .collapse")).map((function (e) { return new bootstrap.Collapse(e, { toggle: !1 }) })); for (var n of t) n.addEventListener("click", (function (t) { if (document.body.classList.toggle("sidebar-toggled"), e.classList.toggle("toggled"), e.classList.contains("toggled")) for (var n of o) n.hide() })); window.addEventListener("resize", (function () { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) < 768) for (var e of o) e.hide() })) } var i = document.querySelector("body.fixed-nav .sidebar"); i && i.on("mousewheel DOMMouseScroll wheel", (function (e) { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 768) { var t = e.originalEvent, o = t.wheelDelta || -t.detail; this.scrollTop += 30 * (o < 0 ? 1 : -1), e.preventDefault() } })); var l = document.querySelector(".scroll-to-top"); l && window.addEventListener("scroll", (function () { var e = window.pageYOffset; l.style.display = e > 100 ? "block" : "none" })) }();

let minusBalance, debtBalance, role;

function getCurrentDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Месяцы в JavaScript начинаются с 0
    const year = today.getFullYear();

    return `${day}.${month}.${year}`;
}

const changeLine = (node, value) => {
    const children = Array.from(node.children);
    const keys = role === "Moderator" || role === "Depositor" ?
        ["name", "telegram", "phone", "last_transaction_date", "balance"] :
        ["name", "telegram", "phone", "last_transaction_date", "button", "balance"];
    node.id = value.id;

    children.forEach((elem, i) => {
        if (keys[i] === "balance") {
            elem.classList.remove("text-success");
            elem.classList.remove("text-danger");
            changeValue(elem, value[keys[i]])
        } else if (keys[i] === "name") {
            elem.textContent = `${value.first_name} ${value.last_name}`;
        } else if (keys[i] === "telegram") {
            elem.textContent = `@${value.telegram}`;
        } else if (keys[i] === "phone") {
            elem.textContent = value.phone;
        } else if (keys[i] === "last_transaction_date") {
            if (value.last_transaction_date) {
                const date = new Date(value.last_transaction_date);

                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
                const year = date.getUTCFullYear();

                elem.textContent = `${day}.${month}.${year}`;

                if (window.location.hash === "#is_debtor") {
                    // Текущая дата
                    const currentDate = new Date();
                    const differenceInTime = Math.abs(date - currentDate); // Разница во времени в миллисекундах
                    const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24); // Конвертация в дни

                    node.classList[differenceInDays >= 5 ? "add" : "remove"]("big_debtor");
                } else {
                    node.classList.remove("big_debtor");
                }
            } else {
                elem.textContent = "Транзакций нет";
                node.classList.remove("big_debtor");
            }
        }
    })
}

checkTokens().then(async () => {
    const lines = document.querySelectorAll("tbody > tr")
    const name = document.querySelector("#username");
    const search = document.querySelector("#search");
    const searchButton = document.querySelector("#search-btn");
    const linkOnlyForAdmins = document.querySelectorAll("#onlyForAdmin");
    const records = document.querySelector("#records");
    const noRecords = document.querySelector("#no-records");
    debtBalance = document.querySelector("#debt_balance");

    const parsedToken = parseJwt(getCookieValue("access"));

    const MAX_LINES = 10;

    const getCustomersByDefinedName = () => {
        const requestLink = window.location.hash === "#is_debtor" ?
            `users/customers?name=${search.value}&limit=${MAX_LINES}&is_debtor=true` :
            `users/customers?name=${search.value}&limit=${MAX_LINES}`

        sendFetchGet(
            requestLink,
            getCookieValue("access"),
            (data) => {
                if (data.errors.length > 0) {
                    alert(data.errors[0])
                } else {
                    if (data.data.pagination.total === 0) {
                        records.classList.remove("active");
                        noRecords.classList.add("active");
                    } else {
                        records.classList.add("active");
                        noRecords.classList.remove("active");

                        for (let i = 0; i < MAX_LINES; i++) {
                            if (i > data.data.items.length - 1) {
                                lines[i].style.display = "none";
                            } else {
                                lines[i].style.display = "table-row";
                                changeLine(lines[i], data.data.items[i]);
                            }
                        }

                        data.id = search.value;

                        deletePagination();
                        createPagination(data, lines, changeLine, "definedCustomers");
                    }
                }
            }
        )
    }

    lines.forEach((elem) => {
        elem.addEventListener("click", (e) => {
            if (!e.target.classList.contains("btn")) {
                e.preventDefault();
                sessionStorage.setItem("client_id", elem.id);
                window.location = `${window.location.origin}/client`;
            }
        });
    });

    sendFetchGet(
        "transactions/balances_sum?positive=false",
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                changeValue(debtBalance, data.data.total, true);
            }
        }
    );

    sendFetchGet(
        `transactions/transaction_types?offset=0&limit=100`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                minusBalance = data.data.items.find((elem) => elem.type === "Снятие с баланса").id;
            }
        }
    )

    const requestLink = window.location.hash === "#is_debtor" ?
        `users/customers?&limit=${MAX_LINES}&is_debtor=true` :
        `users/customers?&limit=${MAX_LINES}`

    sendFetchGet(
        `users/${parsedToken.user_id}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                role = data.data.role;

                if (role === "Customer") {
                    window.location = `${window.location.origin}/orders`;
                } else if (role === "Moderator") {
                    linkOnlyForAdmins.forEach((elem) => elem.remove());
                } else if (role === "Admin") {
                    createLogicForAddModal();
                } else {
                    const changeBalanceBlock = document.querySelector("th#onlyForAdmin");
                    changeBalanceBlock.remove();
                }

                name.textContent = data.data.username;
                
                sendFetchGet(
                    requestLink,
                    getCookieValue("access"),
                    (data) => {
                        if (data.errors.length > 0) {
                            alert(data.errors[0])
                        } else {
                            if (data.data?.pagination?.total === 0 || Object.keys(data.data).length === 0) {
                                records.classList.remove("active");
                                noRecords.classList.add("active");
                            } else {
                                records.classList.add("active");
                                noRecords.classList.remove("active");
                                for (let i = 0; i < MAX_LINES; i++) {
                                    if (i > data.data.items.length - 1) {
                                        lines[i].style.display = "none";
                                    } else {
                                        lines[i].style.display = "table-row";
                                        changeLine(lines[i], data.data.items[i]);
                                    }
                                }
            
                                createPagination(data, lines, changeLine, "customers");
                            }
            
                            plugActivity(false);
                            isMobile && checkMobile();
                        }
                    }
                )
            }
        }
    )

    search.addEventListener('keypress', function (e) {
        // если пользователь нажал на Enter
        if (e.which === 13) {
            getCustomersByDefinedName()
        }
    });

    searchButton.addEventListener("click", () => {
        getCustomersByDefinedName();
    });
});

const createLogicForAddModal = () => {
    const addOperationModal = document.querySelector("#add-operation-modal");
    const addOperationModalInputs = addOperationModal.querySelectorAll(".modal-input-text");
    const addOperationModalBtns = addOperationModal.querySelectorAll("button");
    const addOperationOpenModal = document.querySelectorAll("#add-operation");

    let id, balanceNode, transactionDateNode,
        date = getCurrentDate();

    const modalActivity = (state) => {
        [...addOperationModalInputs, ...addOperationModalBtns].forEach((elem, i) => {
            elem.style.opacity = state ? 1 : 0.5;
            elem.style.pointerEvents = state ? "auto" : "none";
            elem.tabIndex = state ? i + 1 : -1;
        })
    }

    const closeModal = () => {
        const backdrop = document.querySelector(".modal-backdrop");

        addOperationModalInputs.forEach((elem) => elem.value = "");
        addOperationModalInputs[0].style.outline = "none";
        addOperationModal.classList.remove("show");
        addOperationModal.style.display = "none";
        backdrop.classList.remove("show");
        backdrop.style.zIndex = -1;
    }


    addOperationOpenModal.forEach((elem) => {
        elem.addEventListener("click", () => {
            const backdrop = document.querySelector(".modal-backdrop");

            id = Number(elem.parentElement.parentElement.id);
            balanceNode = elem.parentElement.parentElement.children[5];
            transactionDateNode = elem.parentElement.parentElement.children[3];

            backdrop.style.zIndex = 2;
            backdrop.classList.add("show");
            addOperationModal.classList.add("show");
            addOperationModal.style.display = "block";
            addOperationModalInputs[0].focus();
        })
    })

    addOperationModalBtns.forEach((elem, i) => {
        elem.addEventListener("click", () => {
            if (i === 2) {
                if (addOperationModalInputs[0].value.replace(/\+\-/g, "").length > 0) {
                    modalActivity(false);
                    addOperationModalInputs[0].style.outline = "none";

                    sendFetchPostWithAccess(
                        `transactions/`,
                        getCookieValue("access"),
                        {
                            "transaction_type_id": minusBalance,
                            "customer_id": id,
                            "amount": -Number(addOperationModalInputs[0].value),
                            "comment": addOperationModalInputs[1].value
                        },
                        (data) => {
                            if (data.errors.length > 0) {
                                alert(data.errors[0])
                            } else {
                                sendFetchGet(
                                    `users/${id}/balance`,
                                    getCookieValue("access"),
                                    (data) => {
                                        if (data.errors.length > 0) {
                                            alert(data.errors[0])
                                        } else {
                                            changeValue(balanceNode, data.data.balance);
                                            transactionDateNode.textContent = date;
                                            closeModal();
                                            modalActivity(true);
                                        }
                                    }
                                )

                                sendFetchGet(
                                    "transactions/balances_sum?positive=false",
                                    getCookieValue("access"),
                                    (data) => {
                                        if (data.errors.length > 0) {
                                            alert(data.errors[0])
                                        } else {
                                            changeValue(debtBalance, data.data.total, true);
                                        }
                                    }
                                );
                            }
                        }
                    )
                } else {
                    addOperationModalInputs[0].style.outline = "1px solid red";
                }
            } else {
                closeModal();
            }
        })
    })

    document.addEventListener("keypress", () => {
        if (event.key === "Enter" && addOperationModal.classList.contains("show")) {
            if (addOperationModalInputs[0].value.replace(/\+\-/g, "").length > 0) {
                modalActivity(false);
                addOperationModalInputs[0].style.outline = "none";

                sendFetchPostWithAccess(
                    `transactions/`,
                    getCookieValue("access"),
                    {
                        "transaction_type_id": minusBalance,
                        "customer_id": id,
                        "amount": -Number(addOperationModalInputs[0].value),
                        "comment": addOperationModalInputs[1].value
                    },
                    (data) => {
                        if (data.errors.length > 0) {
                            alert(data.errors[0])
                        } else {
                            sendFetchGet(
                                `users/${id}/balance`,
                                getCookieValue("access"),
                                (data) => {
                                    if (data.errors.length > 0) {
                                        alert(data.errors[0])
                                    } else {
                                        changeValue(balanceNode, data.data.balance);
                                        transactionDateNode.textContent = date;
                                        closeModal();
                                        modalActivity(true);
                                    }
                                }
                            )

                            sendFetchGet(
                                "transactions/balances_sum?positive=false",
                                getCookieValue("access"),
                                (data) => {
                                    if (data.errors.length > 0) {
                                        alert(data.errors[0])
                                    } else {
                                        changeValue(debtBalance, data.data.total, true);
                                    }
                                }
                            );
                        }
                    }
                )
            } else {
                addOperationModalInputs[0].style.outline = "1px solid red";
            }
        }
    })
}

