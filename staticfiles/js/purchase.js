import { SITE, sendFetchGet, sendFetchPostFile, sendFetchPostWithAccess, sendFetchPut } from "./api.js";
import { changeValue, checkTokens, getCookieValue, createPagination, plugActivity, isMobile, checkMobile, deletePagination, parseJwt } from "./functions.js";

!function () { "use strict"; var e = document.querySelector(".sidebar"), t = document.querySelectorAll("#sidebarToggle, #sidebarToggleTop"); if (e) { e.querySelector(".collapse"); var o = [].slice.call(document.querySelectorAll(".sidebar .collapse")).map((function (e) { return new bootstrap.Collapse(e, { toggle: !1 }) })); for (var n of t) n.addEventListener("click", (function (t) { if (document.body.classList.toggle("sidebar-toggled"), e.classList.toggle("toggled"), e.classList.contains("toggled")) for (var n of o) n.hide() })); window.addEventListener("resize", (function () { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) < 768) for (var e of o) e.hide() })) } var i = document.querySelector("body.fixed-nav .sidebar"); i && i.on("mousewheel DOMMouseScroll wheel", (function (e) { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 768) { var t = e.originalEvent, o = t.wheelDelta || -t.detail; this.scrollTop += 30 * (o < 0 ? 1 : -1), e.preventDefault() } })); var l = document.querySelector(".scroll-to-top"); l && window.addEventListener("scroll", (function () { var e = window.pageYOffset; l.style.display = e > 100 ? "block" : "none" })) }();
let totalSum = 0, day, role, user_id;

const transactionRequestsSwitch = document.querySelector("#switchCheckDefault");
const transactionRequestsLabel = document.querySelector("#transaction-requests-count");
const MAX_LINES = 100;

const changeLine = (node, value, page) => {
    const children = Array.from(node.children);
    const keys = ["provider", page === "requests" ? "amount" : "total",];
    node.id = page === "requests" ? value.id : "";

    children.forEach((elem, i) => {
        if (i === 0) {
            elem.textContent = value[keys[i]];
        } else if (i === 1) {
            elem.classList.remove("text-success");
            elem.classList.remove("text-danger");
            changeValue(elem, value[keys[i]])
        } else if (i === 2) {
            elem.style.display = role === "Admin" && page === "requests" ? "block" : "none";
        }
    })
}

checkTokens().then(async () => {
    const lines = document.querySelectorAll("tbody > tr");
    const name = document.querySelector("#username");
    const records = document.querySelector("#records");
    const noRecords = document.querySelector("#no-records");
    const purchaseDate = document.querySelector("#purchase-date");
    const totalPurchases = document.querySelector("#total-purchase");
    const linkOnlyForAdmins = document.querySelectorAll("#onlyForAdmin");
    const addOperationOpenModal = document.querySelector(".add-operation");
    const requestsTitle = document.querySelector(".requests-title");

    const parsedToken = parseJwt(getCookieValue("access"));

    day = new Date().toISOString().split('T')[0];

    lines.forEach((elem) => {
        elem.addEventListener("click", (e) => {
            if (e.target.type === "button") return;
            elem.classList.toggle("checked_client");
        })
    })

    purchaseDate.max = day;
    purchaseDate.value = day;

    const getPurchases = (isFirst, func) => {
        totalSum = 0;

        sendFetchGet(
            `transactions/provider_total?offset=0&limit=${MAX_LINES}&on_date=${day}`,
            getCookieValue("access"),
            (data) => {
                if (data.errors.length > 0) {
                    alert(data.errors[0])
                } else {
                    const transactions = data.data.items;

                    if (!transactionRequestsSwitch.checked) {
                        requestsTitle.style.display = "none";
                    } else {
                        transactionRequestsSwitch.checked = false;
                        requestsTitle.style.display = "none";
                    }

                    if (data.data.pagination.total === 0) {
                        records.classList.remove("active");
                        noRecords.classList.add("active");
                        changeValue(totalPurchases, 0, true);
                    } else {
                        records.classList.add("active");
                        noRecords.classList.remove("active");

                        for (let i = 0; i < MAX_LINES; i++) {
                            if (i > transactions.length - 1) {
                                lines[i].style.display = "none";
                            } else {
                                totalSum += transactions[i].total;
                                lines[i].style.display = "table-row";
                                lines[i].classList.remove("checked_client");
                                changeLine(lines[i], transactions[i]);
                            }
                        }

                        if (!transactionRequestsSwitch.checked) {
                            requestsTitle.style.display = "none";
                        }

                        changeValue(totalPurchases, totalSum, true);
                    }

                    if (isFirst) {
                        plugActivity(false);
                        isMobile && checkMobile();
                    } else {
                        func && func();
                    }
                }
            }
        )
    }

    purchaseDate.addEventListener("change", () => {
        day = purchaseDate.value;
        getPurchases();
    });

    sendFetchGet(
        `transaction_requests/?status=requested&offset=0&&limit=${MAX_LINES}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                transactionRequestsSwitch.disabled = data.data.pagination.total === 0;
                transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;
            }
        }
    );

    transactionRequestsSwitch.addEventListener('change', (e) => {
        transactionRequestsSwitch.disabled = true;

        if (e.target.checked) {

            sendFetchGet(
                `transaction_requests/?status=requested&offset=0&limit=${MAX_LINES}`,
                getCookieValue("access"),
                (data) => {
                    const transactions = data.data.items;

                    records.classList.add("active");
                    noRecords.classList.remove("active");

                    transactionRequestsSwitch.disabled = false;
                    transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;
                    if (role === "Admin") requestsTitle.style.display = "block";

                    for (let i = 0; i < MAX_LINES; i++) {
                        if (i > transactions.length - 1) {
                            lines[i].style.display = "none";
                        } else {
                            totalSum += transactions[i].total;
                            lines[i].style.display = "table-row";
                            lines[i].classList.remove("checked_client");
                            changeLine(lines[i], transactions[i], "requests");
                        }
                    }
                }
            );
        } else {
            let totalSum = 0;

            sendFetchGet(
                `transactions/provider_total?offset=0&limit=${MAX_LINES}&on_date=${day}`,
                getCookieValue("access"),
                (data) => {
                    if (data.errors.length > 0) {
                        alert(data.errors[0])
                    } else {
                        const transactions = data.data.items;
                        transactionRequestsSwitch.disabled = false;
                        requestsTitle.style.display = "none";

                        if (data.data.pagination.total === 0) {
                            records.classList.remove("active");
                            noRecords.classList.add("active");
                            changeValue(totalPurchases, 0, true);
                        } else {
                            records.classList.add("active");
                            noRecords.classList.remove("active");

                            for (let i = 0; i < MAX_LINES; i++) {
                                if (i > transactions.length - 1) {
                                    lines[i].style.display = "none";
                                } else {
                                    totalSum += transactions[i].total;
                                    lines[i].style.display = "table-row";
                                    lines[i].classList.remove("checked_client");
                                    changeLine(lines[i], transactions[i]);
                                }
                            }

                            changeValue(totalPurchases, totalSum, true);
                        }

                    }
                }
            )
        }
    });

    await sendFetchGet(
        `users/${parsedToken.user_id}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                role = data.data.role;
                user_id = data.data.id;

                if (role === "Customer") {
                    window.location = `${window.location.origin}/orders`;
                } else if (role === "Moderator") {
                    linkOnlyForAdmins.forEach((elem) => elem.remove());
                } else if (role === "Depositor") {
                    addOperationOpenModal.remove();
                } else if (role === "Admin") {
                    createLogicForButtons();
                }

                name.textContent = data.data.username;

                sendFetchGet(
                    `transactions/transaction_types?offset=0&limit=100`,
                    getCookieValue("access"),
                    (data) => {
                        if (data.errors.length > 0) {
                            alert(data.errors[0])
                        } else {
                            const purchaseID = data.data.items.find((elem) => elem.type === "Закуп").id;
                            if (role === "Admin" || role === "Moderator") {
                                createLogicForAddModal(purchaseID, getPurchases, role, user_id)
                            }
                            getPurchases(true);
                        }
                    }
                )
            }
        }
    )

    const createLogicForButtons = () => {
        const successRequests = document.querySelectorAll(".btn-success");
        const declineRequests = document.querySelectorAll(".btn-danger");

        successRequests.forEach((elem) => {
            elem.addEventListener("click", () => {
                const parent = elem.parentElement.parentElement;
                const id = parent.id;
                elem.disabled = true;

                sendFetchPostWithAccess(
                    `transaction_requests/${id}/approve?approver_id=${user_id}`,
                    getCookieValue("access"),
                    {},
                    (data) => {
                        elem.disabled = false;

                        sendFetchGet(
                            `transaction_requests/?status=requested&offset=0&limit=${MAX_LINES}`,
                            getCookieValue("access"),
                            (data) => {
                                const transactions = data.data.items;

                                if(data.data.pagination.total === 0) {
                                    transactionRequestsSwitch.disabled = true;
                                    transactionRequestsLabel.textContent = `(0)`;

                                    getPurchases();
                                } else {
                                    transactionRequestsSwitch.disabled = false;
                                    transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;
                                    if (role === "Admin") requestsTitle.style.display = "block";
                
                                    for (let i = 0; i < MAX_LINES; i++) {
                                        if (i > transactions.length - 1) {
                                            lines[i].style.display = "none";
                                        } else {
                                            totalSum += transactions[i].total;
                                            lines[i].style.display = "table-row";
                                            lines[i].classList.remove("checked_client");
                                            changeLine(lines[i], transactions[i], "requests");
                                        }
                                    } 
                                }
                            }
                        );
                    }
                )
            })
        })

        declineRequests.forEach((elem) => {
            elem.addEventListener("click", () => {
                const parent = elem.parentElement.parentElement;
                const id = parent.id;
                elem.disabled = true;

                sendFetchPostWithAccess(
                    `transaction_requests/${id}/reject?approver_id=${user_id}`,
                    getCookieValue("access"),
                    {},
                    (data) => {
                        elem.disabled = false;

                        sendFetchGet(
                            `transaction_requests/?status=requested&offset=0&limit=${MAX_LINES}`,
                            getCookieValue("access"),
                            (data) => {
                                const transactions = data.data.items;

                                if(data.data.pagination.total === 0) {
                                    transactionRequestsSwitch.disabled = true;
                                    transactionRequestsLabel.textContent = `(0)`;

                                    getPurchases();
                                } else {
                                    transactionRequestsSwitch.disabled = false;
                                    transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;
                                    if (role === "Admin") requestsTitle.style.display = "block";
                
                                    for (let i = 0; i < MAX_LINES; i++) {
                                        if (i > transactions.length - 1) {
                                            lines[i].style.display = "none";
                                        } else {
                                            totalSum += transactions[i].total;
                                            lines[i].style.display = "table-row";
                                            lines[i].classList.remove("checked_client");
                                            changeLine(lines[i], transactions[i], "requests");
                                        }
                                    } 
                                }
                            }
                        );
                    }
                )
            })
        })
    }
});


const createLogicForAddModal = (id, fetch, role, user_id) => {
    const addOperationModal = document.querySelector("#add-operation-modal");
    const addOperationModalInputs = addOperationModal.querySelectorAll(".modal-input-text");
    const addOperationModalBtns = addOperationModal.querySelectorAll("button");
    const addOperationOpenModal = document.querySelector(".add-operation");
    const purchaseDate = document.querySelector("#purchase-date");
    const records = document.querySelector("#records");
    const noRecords = document.querySelector("#no-records");
    const requestsTitle = document.querySelector(".requests-title");
    const lines = document.querySelectorAll("tbody > tr");

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
        addOperationModalInputs[1].style.outline = "none";
        addOperationModal.classList.remove("show");
        addOperationModal.style.display = "none";
        backdrop.classList.remove("show");
        backdrop.style.zIndex = -1;
    }


    addOperationOpenModal.addEventListener("click", () => {
        const backdrop = document.querySelector(".modal-backdrop");

        backdrop.style.zIndex = 2;
        backdrop.classList.add("show");
        addOperationModal.classList.add("show");
        addOperationModal.style.display = "block";
        addOperationModalInputs[0].focus();
    })

    addOperationModalBtns.forEach((elem, i) => {
        elem.addEventListener("click", () => {
            if (i === 2) {
                if (
                    addOperationModalInputs[0].value.replace(/\+\-/g, "").length > 0 &&
                    addOperationModalInputs[1].value.replace(/\+\-/g, "").length > 0
                ) {
                    modalActivity(false);
                    addOperationModalInputs[0].style.outline = "none";
                    addOperationModalInputs[1].style.outline = "none";

                    if (role === "Admin") {
                        sendFetchPostWithAccess(
                            `transactions/`,
                            getCookieValue("access"),
                            {
                                "transaction_type_id": id,
                                "amount": -Number(addOperationModalInputs[0].value),
                                "provider": addOperationModalInputs[1].value,
                            },
                            (data) => {
                                if (data.errors.length > 0) {
                                    alert(data.errors[0])
                                } else {
                                    day = new Date().toISOString().split('T')[0];
                                    purchaseDate.value = day;

                                    fetch(
                                        false,
                                        () => {
                                            closeModal();
                                            modalActivity(true);
                                        }
                                    )
                                }
                            }
                        )
                    } else {
                        // TRANSACTION REQUESTS
                        sendFetchPostWithAccess(
                            `transaction_requests/`,
                            getCookieValue("access"),
                            {
                                "transaction_type_id": id,
                                "amount": -Number(addOperationModalInputs[0].value),
                                "requester_id": user_id,
                                "provider": addOperationModalInputs[1].value,
                            },
                            (data) => {
                                if (data.errors.length > 0) {
                                    alert(data.errors[0])
                                } else {
                                    sendFetchGet(
                                        `transaction_requests/?status=requested&offset=0&limit=${MAX_LINES}`,
                                        getCookieValue("access"),
                                        (data) => {
                                            if (data.errors.length > 0) {
                                                alert(data.errors[0])
                                            } else {
                                                transactionRequestsSwitch.disabled = data.data.pagination.total === 0;
                                                transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;

                                                if (transactionRequestsSwitch.checked) {
                                                    const transactions = data.data.items;

                                                    records.classList.add("active");
                                                    noRecords.classList.remove("active");

                                                    transactionRequestsSwitch.disabled = false;
                                                    transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;
                                                    requestsTitle.style.display = "block";

                                                    for (let i = 0; i < MAX_LINES; i++) {
                                                        if (i > transactions.length - 1) {
                                                            lines[i].style.display = "none";
                                                        } else {
                                                            totalSum += transactions[i].total;
                                                            lines[i].style.display = "table-row";
                                                            lines[i].classList.remove("checked_client");
                                                            changeLine(lines[i], transactions[i], "requests");
                                                        }
                                                    }
                                                }

                                                closeModal();
                                                modalActivity(true);
                                            }
                                        }
                                    );
                                }
                            }
                        )
                    }
                } else {
                    if (addOperationModalInputs[0].value.replace(/\+\-/g, "").length <= 0) addOperationModalInputs[0].style.outline = "1px solid red";
                    if (addOperationModalInputs[1].value.replace(/\+\-/g, "").length <= 0) addOperationModalInputs[1].style.outline = "1px solid red";
                }
            } else {
                closeModal();
            }
        })
    })

    document.addEventListener("keypress", () => {
        if (event.key === "Enter" && addOperationModal.classList.contains("show")) {
            if (
                addOperationModalInputs[0].value.replace(/\+\-/g, "").length > 0 &&
                addOperationModalInputs[1].value.replace(/\+\-/g, "").length > 0
            ) {
                modalActivity(false);
                addOperationModalInputs[0].style.outline = "none";
                addOperationModalInputs[1].style.outline = "none";

                if (role === "Admin") {
                    sendFetchPostWithAccess(
                        `transactions/`,
                        getCookieValue("access"),
                        {
                            "transaction_type_id": id,
                            "amount": -Number(addOperationModalInputs[0].value),
                            "provider": addOperationModalInputs[1].value,
                        },
                        (data) => {
                            if (data.errors.length > 0) {
                                alert(data.errors[0])
                            } else {
                                day = new Date().toISOString().split('T')[0];
                                purchaseDate.value = day;

                                fetch(
                                    false,
                                    () => {
                                        closeModal();
                                        modalActivity(true);
                                    }
                                )
                            }
                        }
                    )
                } else {
                    // TRANSACTION REQUESTS
                    sendFetchPostWithAccess(
                        `transaction_requests/`,
                        getCookieValue("access"),
                        {
                            "transaction_type_id": id,
                            "amount": -Number(addOperationModalInputs[0].value),
                            "requester_id": user_id,
                            "provider": addOperationModalInputs[1].value,
                        },
                        (data) => {
                            if (data.errors.length > 0) {
                                alert(data.errors[0])
                            } else {
                                sendFetchGet(
                                    `transaction_requests/?status=requested&offset=0&limit=${MAX_LINES}`,
                                    getCookieValue("access"),
                                    (data) => {
                                        if (data.errors.length > 0) {
                                            alert(data.errors[0])
                                        } else {
                                            transactionRequestsSwitch.disabled = data.data.pagination.total === 0;
                                            transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;

                                            if (transactionRequestsSwitch.checked) {
                                                const transactions = data.data.items;

                                                records.classList.add("active");
                                                noRecords.classList.remove("active");

                                                transactionRequestsSwitch.disabled = false;
                                                transactionRequestsLabel.textContent = `(${data.data.pagination.total})`;
                                                requestsTitle.style.display = "block";

                                                for (let i = 0; i < MAX_LINES; i++) {
                                                    if (i > transactions.length - 1) {
                                                        lines[i].style.display = "none";
                                                    } else {
                                                        totalSum += transactions[i].total;
                                                        lines[i].style.display = "table-row";
                                                        lines[i].classList.remove("checked_client");
                                                        changeLine(lines[i], transactions[i], "requests");
                                                    }
                                                }
                                            }

                                            closeModal();
                                            modalActivity(true);
                                        }
                                    }
                                );
                            }
                        }
                    )
                }
            } else {
                if (addOperationModalInputs[0].value.replace(/\+\-/g, "").length <= 0) addOperationModalInputs[0].style.outline = "1px solid red";
                if (addOperationModalInputs[1].value.replace(/\+\-/g, "").length <= 0) addOperationModalInputs[1].style.outline = "1px solid red";
            }
        }
    })
}
