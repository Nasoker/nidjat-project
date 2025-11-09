import { sendFetchGet, sendFetchPostWithAccess } from "./api.js";
import { checkMobile, checkTokens, getCookieValue, isMobile, parseJwt, plugActivity } from "./functions.js";

!function () { "use strict"; var e = document.querySelector(".sidebar"), t = document.querySelectorAll("#sidebarToggle, #sidebarToggleTop"); if (e) { e.querySelector(".collapse"); var o = [].slice.call(document.querySelectorAll(".sidebar .collapse")).map((function (e) { return new bootstrap.Collapse(e, { toggle: !1 }) })); for (var n of t) n.addEventListener("click", (function (t) { if (document.body.classList.toggle("sidebar-toggled"), e.classList.toggle("toggled"), e.classList.contains("toggled")) for (var n of o) n.hide() })); window.addEventListener("resize", (function () { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) < 768) for (var e of o) e.hide() })) } var i = document.querySelector("body.fixed-nav .sidebar"); i && i.on("mousewheel DOMMouseScroll wheel", (function (e) { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 768) { var t = e.originalEvent, o = t.wheelDelta || -t.detail; this.scrollTop += 30 * (o < 0 ? 1 : -1), e.preventDefault() } })); var l = document.querySelector(".scroll-to-top"); l && window.addEventListener("scroll", (function () { var e = window.pageYOffset; l.style.display = e > 100 ? "block" : "none" })) }();

const createLine = (table, info, role) => {
    const bodyLine = document.createElement("tr");
    bodyLine.classList.add("table_row");

    for (let i = 0; i < 5; i++) {
        const cell = document.createElement("td");
        cell.classList.add("text-center");

        if (i === 0) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("salary_checkbox");
            cell.appendChild(checkbox);
        } else if (i === 1) {
            cell.textContent = `${info.first_name} ${info.last_name}`;
        } else if (i === 2 || i === 4) {
            cell.textContent = `${info.salary}`;
        } else {
            cell.textContent = `0`;
        }

        bodyLine.appendChild(cell);
        Array.from(bodyLine.children).forEach((elem, i) => {
            elem.addEventListener("click", () => {
                if(role === "Admin") {
                    if (i !== 0) {
                        const backdrop = document.querySelector(".modal-backdrop");
                        const changeSalaryModal = document.querySelector("#modal-change-salary");
                        const changeSalaryModalInputs = changeSalaryModal.querySelectorAll(".modal-input-text");

                        changeSalaryModal.classList.add("show");
                        changeSalaryModal.style.display = "block";
                        backdrop.classList.add("show");
                        backdrop.style.zIndex = 1;

                        const lineElems = bodyLine.querySelectorAll("td");

                        const sum = lineElems[2].textContent;
                        const bonus = lineElems[3].textContent;

                        changeSalaryModalInputs[0].value = Number(sum);
                        changeSalaryModalInputs[1].value = Number(bonus);
                        bodyLine.id = "active";
                    }
                }
            })
        })
    }

    table.appendChild(bodyLine);
}

checkTokens().then(async () => {
    const name = document.querySelector("#username");
    const tableBody = document.querySelector("tbody");
    const finishBtn = document.querySelector("#btn-finish-salary")
    const parsedToken = parseJwt(getCookieValue("access"));

    await sendFetchGet(
        `users/${parsedToken.user_id}`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                const role = data.data.role;

                if(role === "Customer"){
                    window.location = `${window.location.origin}/orders`;
                } else if(role !== "Admin" && role !== "Depositor"){
                    window.location = `${window.location.origin}/clients`;
                }

                if(role === "Admin") {
                    createLogicForChangeSalary();
                    createLogicCountSalaryModal();
                } else {
                    finishBtn.remove();
                }

                sendFetchGet(
                    `users/employees?&limit=100`,
                    getCookieValue("access"),
                    (data) => {
                        if (data.errors.length > 0) {
                            alert(data.errors[0])
                        } else {
                            data.data.items.forEach((elem, i) => {
                                elem.salary !== 0 && createLine(tableBody, elem, role);
                            })
            
                            plugActivity(false);
                            isMobile && checkMobile();
                        }
                    }
                )

                name.textContent = data.data.username;
            }
        }
    )

    finishBtn.addEventListener("click", () => {
        const backdrop = document.querySelector(".modal-backdrop");
        const changeSalaryModal = document.querySelector("#salary-out");
        const salaryCount = document.querySelector(".sum-salary");
        const tableBody = document.querySelector("tbody");
        const allTableLines = tableBody.querySelectorAll(".table_row");

        const change = (value) => { return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " рублей" }
        if (Array.from(allTableLines).findIndex((elem) => elem.children[0].children[0].checked) !== -1) {
            let count = 0;
            let message = "";

            Array.from(allTableLines).forEach((elem) => {
                if (elem.children[0].children[0].checked) {
                    message +=
                        `${elem.children[1].textContent} - ${Number(elem.children[4].textContent)} рублей. ${Number(elem.children[3].textContent) >= 0 ? "Премия" : "Штраф"} - ${Math.abs(Number(elem.children[3].textContent))}; \n`
                    count += Number(elem.children[4].textContent)
                }
            })

            sendFetchGet(
                `transactions/transaction_types?offset=0&limit=100`,
                getCookieValue("access"),
                (data) => {
                    if (data.errors.length > 0) {
                        alert(data.errors[0])
                    } else {
                        const salaryTransactionID = data.data.items.find((elem) => elem.type === "Заработная плата").id;

                        sendFetchPostWithAccess(
                            `transactions/`,
                            getCookieValue("access"),
                            {
                                "transaction_type_id": salaryTransactionID,
                                "amount": count * -1,
                                "comment": message
                            },
                            (data) => {
                                if (data.errors.length > 0) {
                                    alert(data.errors[0])
                                } else {
                                    changeSalaryModal.classList.add("show");
                                    changeSalaryModal.style.display = "block";
                                    backdrop.classList.add("show");
                                    backdrop.style.zIndex = 1;       
                                    salaryCount.textContent = change(count);                 
                                }
                            }
                        )

                    }
                }
            )
        } else {
            alert("Ни один работник не выбран. Зарплата не может быть расчитана!")
        }
    });
});


const createLogicForChangeSalary = () => {
    const changeSalaryModal = document.querySelector("#modal-change-salary");
    const changeSalaryModalInputs = changeSalaryModal.querySelectorAll(".modal-input-text");
    const changeSalaryModalBtns = changeSalaryModal.querySelectorAll("button");

    const closeModal = () => {
        const backdrop = document.querySelector(".modal-backdrop");

        changeSalaryModalInputs.forEach((elem) => elem.value = "");
        changeSalaryModalInputs[0].style.outline = "none";
        changeSalaryModal.classList.remove("show");
        changeSalaryModal.style.display = "none";
        backdrop.classList.remove("show");
        backdrop.style.zIndex = -1;
    }

    changeSalaryModalBtns.forEach((elem, i) => {
        elem.addEventListener("click", () => {
            if (i === 2) {
                const lineParent = document.querySelector("#active");
                const lineElems = lineParent.querySelectorAll("td");

                lineElems[2].textContent = Number(changeSalaryModalInputs[0].value);
                lineElems[3].textContent = Number(changeSalaryModalInputs[1].value);
                lineElems[4].textContent = Number(changeSalaryModalInputs[0].value) + Number(changeSalaryModalInputs[1].value);
                lineParent.id = "";
            }

            closeModal();
        })
    })
}

const createLogicCountSalaryModal = () => {
    const countSalaryModal = document.querySelector("#salary-out");
    const button = countSalaryModal.querySelector(".btn-close")

    button.addEventListener("click", () => {
        window.location = `${window.location.origin}/salary`;
    })
}