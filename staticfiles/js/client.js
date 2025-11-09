import { SITE, sendFetchGet, sendFetchPostFile, sendFetchPostWithAccess, sendFetchPut } from "./api.js";
import { changeValue, checkTokens, getCookieValue, createPagination, plugActivity, isMobile, checkMobile, deletePagination, parseJwt } from "./functions.js";

!function () { "use strict"; var e = document.querySelector(".sidebar"), t = document.querySelectorAll("#sidebarToggle, #sidebarToggleTop"); if (e) { e.querySelector(".collapse"); var o = [].slice.call(document.querySelectorAll(".sidebar .collapse")).map((function (e) { return new bootstrap.Collapse(e, { toggle: !1 }) })); for (var n of t) n.addEventListener("click", (function (t) { if (document.body.classList.toggle("sidebar-toggled"), e.classList.toggle("toggled"), e.classList.contains("toggled")) for (var n of o) n.hide() })); window.addEventListener("resize", (function () { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) < 768) for (var e of o) e.hide() })) } var i = document.querySelector("body.fixed-nav .sidebar"); i && i.on("mousewheel DOMMouseScroll wheel", (function (e) { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 768) { var t = e.originalEvent, o = t.wheelDelta || -t.detail; this.scrollTop += 30 * (o < 0 ? 1 : -1), e.preventDefault() } })); var l = document.querySelector(".scroll-to-top"); l && window.addEventListener("scroll", (function () { var e = window.pageYOffset; l.style.display = e > 100 ? "block" : "none" })) }();
let minusBalance, plusBalance, role;

const changeLine = (node, value) => {
    const children = Array.from(node.children);
    const keys = ["changeTransaction", "created_at", "amount", "client_balance", "comment", "file"];

    node.id = value.id;
    const formatDate = (dateString) => {
        const date = new Date(dateString);

        const day = date.getDate();
        const month = date.getMonth() + 1; // Месяцы в объекте Date начинаются с 0, поэтому добавляем 1
        const year = date.getFullYear();

        return day + "." + month + "." + year;
    }

    children.forEach((elem, i) => {
        if (i !== 0) {
            if (i === keys.length - 1) {
                if (!value[keys[i]]) {
                    elem.children[0].textContent = "Добавить";
                    elem.children[0].href = "";

                    if(role === "Depositor") {
                        elem.children[0].style.display = "none";
                    }
                } else {
                    elem.children[0].textContent = "Просмотреть";
                    elem.children[0].href = value[keys[i]];
                    elem.children[0].style.display = "block";
                }
            } else {
                if (keys[i] === "client_balance") {
                    elem.textContent = "***********";
                    elem.classList.remove("text-success", "text-danger")
                } else if (typeof (value[keys[i]]) === "number") {
                    elem.classList.remove("text-success");
                    elem.classList.remove("text-danger");
                    changeValue(elem, value[keys[i]])
                } else {
                    elem.textContent = i === 1 ? formatDate(value[keys[i]]) : value[keys[i]];
                }
            }
        }
    })
}

checkTokens().then(async () => {
    if (!sessionStorage.getItem("client_id")) {
        window.location = `${window.location.origin}/clients`;
    }

    const balance = document.querySelector("#balance");
    const lines = document.querySelectorAll("tbody > tr");
    const name = document.querySelector("#username");
    const clientName = document.querySelector("#client_name")
    const telegram = document.querySelector("#telegram");
    const phone = document.querySelector("#phone");
    const CLIENT_ID = sessionStorage.getItem("client_id");
    const records = document.querySelector("#records");
    const linkOnlyForAdmins = document.querySelectorAll("#onlyForAdmin");
    const noRecords = document.querySelector("#no-records");
    const parsedToken = parseJwt(getCookieValue("access"));

    const MAX_LINES = 10;

    const sendTransactions = (firstTime, func, page) => {
        const requestLink = page ?
            `transactions/${CLIENT_ID}?&offset=${MAX_LINES * (page - 1)}&limit=${MAX_LINES}` :
            `transactions/${CLIENT_ID}?&limit=${MAX_LINES}`

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

                        if (firstTime) {
                            plugActivity(false);
                            isMobile && checkMobile();
                        } else {
                            func();
                            sendFetchGet(
                                `users/${CLIENT_ID}/balance`,
                                getCookieValue("access"),
                                (data) => {
                                    if (data.errors.length > 0) {
                                        alert(data.errors[0])
                                    } else {
                                        changeValue(balance, data.data.balance, true);
                                    }
                                }
                            )
                        }
                    } else {
                        records.classList.add("active");
                        noRecords.classList.remove("active");

                        const arrId = [];
                        data.data.items.forEach((elem) => arrId.push(elem.id));
                        const transactions = data.data.items;
                        const transactionsData = data;
                        const pagination = document.querySelector(".pagination");
                        const pageItems = document.querySelectorAll(".page-link");

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
                                            changeLine(lines[i], transactions[i]);
                                        }
                                    }

                                    transactionsData.id = CLIENT_ID;

                                    firstTime && createPagination(transactionsData, lines, changeLine, "transactionsWithFiles");

                                    if(
                                        !firstTime &&
                                        transactionsData.data.pagination.total > transactionsData.data.pagination.limit && 
                                        pagination.style.display === "none"
                                    ) {
                                        createPagination(transactionsData, lines, changeLine, "transactionsWithFiles");
                                    }
                                    
                                    if(
                                        pageItems.length > 0 &&
                                        page !== pageItems[1].value
                                    ) {
                                        deletePagination();
                                        createPagination(transactionsData, lines, changeLine, "transactionsWithFiles");
                                    }
                                }

                                if (firstTime) {
                                    plugActivity(false);
                                    isMobile && checkMobile();
                                } else {
                                    func();
                                    sendFetchGet(
                                        `users/${CLIENT_ID}/balance`,
                                        getCookieValue("access"),
                                        (data) => {
                                            if (data.errors.length > 0) {
                                                alert(data.errors[0])
                                            } else {
                                                changeValue(balance, data.data.balance, true);
                                            }
                                        }
                                    )
                                }
                            }
                        )
                    }
                }
            }
        )
    }

    await sendFetchGet(
        `users/${parsedToken.user_id}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                role = data.data.role;
                
                if(role === "Customer"){
                    window.location = `${window.location.origin}/orders`;
                } else if(role === "Moderator"){
                    linkOnlyForAdmins.forEach((elem) => elem.remove());
                } else if(role === "Admin"){
                    createLogicForAddModal(CLIENT_ID, sendTransactions);
                } else {
                    const addOperation = document.querySelector(".add-operation");
                    addOperation.remove();
                }

                name.textContent = data.data.username;

                if(role !== "Depositor") {
                    createLogicForChangeModal(CLIENT_ID, sendTransactions);
                }
                createLogicForSubtotal(lines);
                createLogicForFiles(sendTransactions, role);


                sendTransactions(true);
            }
        }
    )
    sessionStorage.removeItem("client_id");

    await sendFetchGet(
        `users/${CLIENT_ID}/balance`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                changeValue(balance, data.data.balance, true);
            }
        }
    )

    await sendFetchGet(
        `transactions/transaction_types?offset=0&limit=100`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                minusBalance = data.data.items.find((elem) => elem.type === "Снятие с баланса").id;
                plusBalance = data.data.items.find((elem) => elem.type === "Пополнение баланса").id;
            }
        }
    )

    await sendFetchGet(
        `users/${CLIENT_ID}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                clientName.textContent = `${data.data.first_name} ${data.data.last_name}`;
                telegram.querySelector("a").href = `tg://resolve?domain=${data.data.telegram}`;
                telegram.querySelector("a").textContent = `@${data.data.telegram}`;
                phone.querySelector("a").href = `tel:${data.data.phone.substring(1, data.data.phone.length)}`;
                phone.querySelector("a").textContent = `${data.data.phone}`;
            }
        }
    )
});


const createLogicForAddModal = (id, fetch) => {
    const addOperationModal = document.querySelector("#add-operation-modal");
    const addOperationModalInputs = addOperationModal.querySelectorAll(".modal-input-text");
    const addOperationModalBtns = addOperationModal.querySelectorAll("button");
    const addOperationOpenModal = document.querySelector(".add-operation");

    const modalActivity = (state) => {
        [...addOperationModalInputs, ...addOperationModalBtns].forEach((elem, i) => {
            elem.style.opacity = state ? 1 : 0.5;
            elem.style.pointerEvents = state ? "auto" : "none";
            elem.tabIndex = state ? i+1 : -1;
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
                if (addOperationModalInputs[0].value.replace(/\+\-/g, "").length > 0) {
                    modalActivity(false);
                    addOperationModalInputs[0].style.outline = "none";

                    sendFetchPostWithAccess(
                        `transactions/`,
                        getCookieValue("access"),
                        {
                            "transaction_type_id": Number(addOperationModalInputs[0].value) >= 0 ? plusBalance : minusBalance,
                            "customer_id": id,
                            "amount": Number(addOperationModalInputs[0].value),
                            "comment": addOperationModalInputs[1].value
                        },
                        (data) => {
                            if (data.errors.length > 0) {
                                alert(data.errors[0])
                            } else {
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
                        "transaction_type_id": Number(addOperationModalInputs[0].value) >= 0 ? plusBalance : minusBalance,
                        "customer_id": id,
                        "amount": Number(addOperationModalInputs[0].value),
                        "comment": addOperationModalInputs[1].value
                    },
                    (data) => {
                        if (data.errors.length > 0) {
                            alert(data.errors[0])
                        } else {
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
                addOperationModalInputs[0].style.outline = "1px solid red";
            }
        }
    })
}

const createLogicForChangeModal = (id, fetch) => {
    const changeOperationModal = document.querySelector("#change-operation-modal");
    const changeOperationModalInputs = changeOperationModal.querySelectorAll(".modal-input-text");
    const changeOperationModalBtns = changeOperationModal.querySelectorAll("button");
    const changeOperationOpenModal = document.querySelectorAll(".button_editor");
    const changeOperationFile = document.querySelector(".modal-input-file");
    let operationId = 0, startValueSum, startValueComment

    if(role === "Moderator" || role === "Depositor") {
        changeOperationModalInputs.forEach((elem) => elem.remove())
    }

    const modalActivity = (state) => {
        [...changeOperationModalInputs, ...changeOperationModalBtns].forEach((elem) => {
            elem.style.opacity = state ? 1 : 0.5;
            elem.style.pointerEvents = state ? "auto" : "none";
            elem.tabIndex = -1;
        })
    }

    const closeModal = () => {
        const backdrop = document.querySelector(".modal-backdrop");

        changeOperationModalInputs.forEach((elem) => elem.value = "");
        changeOperationModalInputs[0].style.outline = "none";
        changeOperationModal.classList.remove("show");
        changeOperationModal.style.display = "none";
        backdrop.classList.remove("show");
        backdrop.style.zIndex = -1;
    }

    changeOperationOpenModal.forEach((elem, i) => {
        elem.addEventListener("click", () => {
            const lineParent = elem.parentNode.parentNode;
            const lineElems = lineParent.querySelectorAll("td");
            const backdrop = document.querySelector(".modal-backdrop");

            if (role === "Moderator" && lineElems[5].children[0].textContent === "Просмотреть") {
                operationId = Number(lineParent.id);

                backdrop.style.zIndex = 2;
                backdrop.classList.add("show");
                changeOperationModal.classList.add("show");
                changeOperationModal.style.display = "block";

                changeOperationFile.style.display =
                    lineElems[5].children[0].textContent === "Просмотреть" ? "block" : "none";

            } else if (role !== "Moderator") {
                const sum = lineElems[2].textContent;
                const comment = lineElems[4].textContent;

                changeOperationModalInputs[0].value = Number(sum.replace(/[\s.,%]/g, ''));
                changeOperationModalInputs[1].value = comment;

                operationId = Number(lineParent.id);

                backdrop.style.zIndex = 2;
                backdrop.classList.add("show");
                changeOperationModal.classList.add("show");
                changeOperationModal.style.display = "block";
                changeOperationFile.style.display =
                    lineElems[5].children[0].textContent === "Просмотреть" ? "block" : "none";
            }
        })
    });

    changeOperationModalBtns.forEach((elem, i) => {
        elem.addEventListener("click", () => {
            if (i === 2) {
                if (role === "Moderator") {
                    const form = new FormData();
                    form.append("file", changeOperationFile.files[0])
                    sendFetchPostFile(
                        `receipts/${operationId}/save`,
                        getCookieValue("access"),
                        form,
                        (data) => {
                            if (data.data) {
                                fetch(
                                    false,
                                    () => {
                                        alert(`Файл изменен!`)
                                        closeModal();
                                        modalActivity(true);
                                    },
                                    document.querySelectorAll("input.page-link")[0] &&
                                    document.querySelector("input.page-link").value
                                )
                            }
                        }
                    )
                } else {
                    if (changeOperationModalInputs[0].value.replace(/\+\-/g, "").length > 0) {
                        modalActivity(false);
                        changeOperationModalInputs[0].style.outline = "none";

                        sendFetchPut(
                            `transactions/${operationId}/update`,
                            getCookieValue("access"),
                            {
                                "transaction_type_id": Number(changeOperationModalInputs[0].value) >= 0 ? plusBalance : minusBalance,
                                "amount": Number(changeOperationModalInputs[0].value),
                                "comment": changeOperationModalInputs[1].value
                            },
                            (data) => {
                                if (data.errors.length > 0) {
                                    alert(data.errors[0])
                                } else {
                                    if (changeOperationFile.style.display === "block" && changeOperationFile.value) {
                                        const form = new FormData();
                                        form.append("file", changeOperationFile.files[0])
                                        sendFetchPostFile(
                                            `receipts/${operationId}/save`,
                                            getCookieValue("access"),
                                            form,
                                            (data) => {
                                                if (!data.detail) {
                                                    alert(data.detail[0].msg)
                                                } else {
                                                    fetch(
                                                        false,
                                                        () => {
                                                            alert(`Изменена операция на сумму : ${Number(changeOperationModalInputs[0].value)} рублей. Файл изменен!`)
                                                            closeModal();
                                                            modalActivity(true);
                                                        },
                                                        document.querySelectorAll("input.page-link")[0] &&
                                                        document.querySelector("input.page-link").value
                                                    )
                                                }
                                            }
                                        )
                                    } else {
                                        fetch(
                                            false,
                                            () => {
                                                alert(`Изменена операция на сумму : ${Number(changeOperationModalInputs[0].value)} рублей.`)
                                                closeModal();
                                                modalActivity(true);
                                            },
                                            document.querySelectorAll("input.page-link")[0] &&
                                            document.querySelector("input.page-link").value
                                        )
                                    }
                                }
                            }
                        )
                    } else {
                        changeOperationModalInputs[0].style.outline = "1px solid red";
                    }
                }
            } else {
                closeModal();
            }
        })
    })


    changeOperationFile.addEventListener("change", (e) => {
        if (e.target.files[0].type !== "application/pdf") {
            alert("Ошибка! Прикрепить файл можно только формата .pdf")
            addFileInput.value = "";
        }
    })
}

const createLogicForSubtotal = (lines) => {
    Array.from(lines).forEach((line, i) => {
        Array.from(line.children).forEach((elem, i) => {
            if (i === 3) {
                elem.addEventListener("click", () => {
                    if (elem.textContent === "***********") {

                        sendFetchGet(
                            `transactions/${line.id}/subtotal`,
                            getCookieValue("access"),
                            (data) => {
                                if (data.errors.length > 0) {
                                    alert(data.errors[0])
                                } else {
                                    changeValue(elem, data.data.subtotal);
                                }
                            }
                        )
                    }
                })
            }
        })
    })
}

const createLogicForFiles = (fetch, role) => {
    const addFileModal = document.querySelector("#add-file-modal");
    const addFileInput = addFileModal.querySelector(".modal_input_file");
    const addFileBtns = addFileModal.querySelectorAll("button");
    const addFileOpenModal = document.querySelectorAll("#modal-add-file");
    let operationID = 0;

    const modalActivity = (state) => {
        [addFileInput, ...addFileBtns].forEach((elem) => {
            elem.style.opacity = state ? 1 : 0.5;
            elem.style.pointerEvents = state ? "auto" : "none";
            elem.tabIndex = -1;
        })
    }

    const closeModal = () => {
        const backdrop = document.querySelector(".modal-backdrop");

        addFileInput.value = "";
        addFileModal.classList.remove("show");
        addFileModal.style.display = "none";
        backdrop.classList.remove("show");
        backdrop.style.zIndex = -1;
    }

    addFileOpenModal.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.textContent === "Добавить") {
                if(role !== "Depositor") {
                    const backdrop = document.querySelector(".modal-backdrop");

                    backdrop.style.zIndex = 2;
                    backdrop.classList.add("show");
                    addFileModal.classList.add("show");
                    addFileModal.style.display = "block";

                    operationID = btn.parentNode.parentNode.id;
                }
            } else {
                window.open(SITE + btn.href);
            }
        })
    })

    addFileBtns.forEach((elem, i) => {
        elem.addEventListener("click", () => {
            closeModal();
        })
    })

    addFileInput.addEventListener("change", (e) => {
        if (e.target.files[0].type === "application/pdf") {
            // alert("Загрузка файла начата!");
            const form = new FormData();
            form.append("file", e.target.files[0])
            sendFetchPostFile(
                `receipts/${operationID}/save`,
                getCookieValue("access"),
                form,
                (data) => {
                    if (data.detail) {
                        alert(data.detail[0].msg)
                    } else {
                        fetch(
                            false,
                            () => {
                                alert(`Файл прикреплен`)
                                closeModal();
                                modalActivity(true);
                            },
                            document.querySelectorAll("input.page-link")[0] &&
                            document.querySelector("input.page-link").value
                        )
                    }
                }
            )
        } else {
            alert("Ошибка! Прикрепить файл можно только формата .pdf")
            addFileInput.value = "";
        }
    })
}