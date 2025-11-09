import { SITE, sendFetchGet, sendFetchPostWithAccess } from "./api.js";
import { changeValue, checkTokens, getCookieValue, createPagination, plugActivity, isMobile, checkMobile, parseJwt } from "./functions.js";

!function () { "use strict"; var e = document.querySelector(".sidebar"), t = document.querySelectorAll("#sidebarToggle, #sidebarToggleTop"); if (e) { e.querySelector(".collapse"); var o = [].slice.call(document.querySelectorAll(".sidebar .collapse")).map((function (e) { return new bootstrap.Collapse(e, { toggle: !1 }) })); for (var n of t) n.addEventListener("click", (function (t) { if (document.body.classList.toggle("sidebar-toggled"), e.classList.toggle("toggled"), e.classList.contains("toggled")) for (var n of o) n.hide() })); window.addEventListener("resize", (function () { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) < 768) for (var e of o) e.hide() })) } var i = document.querySelector("body.fixed-nav .sidebar"); i && i.on("mousewheel DOMMouseScroll wheel", (function (e) { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 768) { var t = e.originalEvent, o = t.wheelDelta || -t.detail; this.scrollTop += 30 * (o < 0 ? 1 : -1), e.preventDefault() } })); var l = document.querySelector(".scroll-to-top"); l && window.addEventListener("scroll", (function () { var e = window.pageYOffset; l.style.display = e > 100 ? "block" : "none" })) }();

const changeLine = (node, value) => {
    const children = Array.from(node.children);
    const keys = ["created_at", "amount", "client_balance", "comment", "file"];

    node.id = value.id;

    const formatDate = (dateString) => {
        const date = new Date(dateString);

        const day = date.getDate();
        const month = date.getMonth() + 1; // Месяцы в объекте Date начинаются с 0, поэтому добавляем 1
        const year = date.getFullYear();

        return day + "." + month + "." + year;
    }

    children.forEach((elem, i) => {
        if (i === keys.length - 1) {
            if (!value[keys[i]]) {
                elem.children[0].style.display = "none";
                elem.children[0].href = "";
            } else {
                elem.children[0].style.display = "block";
                elem.children[0].href = value[keys[i]];
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
                elem.textContent = i === 0 ? formatDate(value[keys[i]]) : value[keys[i]];
            }
        }

    })
}

checkTokens().then(async () => {
    const balance = document.querySelector("#balance");
    const lines = document.querySelectorAll("tbody > tr")
    const name = document.querySelector("#username");
    const records = document.querySelector("#records");
    const noRecords = document.querySelector("#no-records");
    const MAX_LINES = 10;
    const parsedToken = parseJwt(getCookieValue("access"));

    createLogicForSubtotal(lines);

    await sendFetchGet(
        `users/${parsedToken.user_id}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                if (data.data.role !== "Customer") {
                    window.location = `${window.location.origin}/clients`;
                }
                name.textContent = data.data.username;
            }
        }
    )

    await sendFetchGet(
        `users/${parsedToken.user_id}/balance`,
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
        `transactions/${parsedToken.user_id}?&limit=${MAX_LINES}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                if (data.data.pagination.total === 0) {
                    records.classList.remove("active");
                    noRecords.classList.add("active");
                } else {
                    const arrId = [];
                    data.data.items.forEach((elem) => arrId.push(elem.id));
                    const transactions = data.data.items;
                    const transactionsData = data;

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

                                transactionsData.id = parsedToken.user_id;

                                createPagination(transactionsData, lines, changeLine, "transactionsWithFiles");
                            }
                        }
                    )
                }

                plugActivity(false);
                isMobile && checkMobile();
            }
        }
    )

    const downloadFiles = document.querySelectorAll("#download-file");
    downloadFiles.forEach((elem) => {
        elem.addEventListener("click", () => {
            window.open(SITE + elem.href);
        })
    })
});


const createLogicForSubtotal = (lines) => {
    Array.from(lines).forEach((line, i) => {
        Array.from(line.children).forEach((elem, i) => {
            if (i === 2) {
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