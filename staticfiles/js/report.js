import { sendFetchGet, sendFetchPut } from "./api.js";
import { changeValue, checkMobile, checkTokens, getCookieValue, isMobile, parseCurrency, parseJwt, plugActivity } from "./functions.js";

!function () { "use strict"; var e = document.querySelector(".sidebar"), t = document.querySelectorAll("#sidebarToggle, #sidebarToggleTop"); if (e) { e.querySelector(".collapse"); var o = [].slice.call(document.querySelectorAll(".sidebar .collapse")).map((function (e) { return new bootstrap.Collapse(e, { toggle: !1 }) })); for (var n of t) n.addEventListener("click", (function (t) { if (document.body.classList.toggle("sidebar-toggled"), e.classList.toggle("toggled"), e.classList.contains("toggled")) for (var n of o) n.hide() })); window.addEventListener("resize", (function () { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) < 768) for (var e of o) e.hide() })) } var i = document.querySelector("body.fixed-nav .sidebar"); i && i.on("mousewheel DOMMouseScroll wheel", (function (e) { if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 768) { var t = e.originalEvent, o = t.wheelDelta || -t.detail; this.scrollTop += 30 * (o < 0 ? 1 : -1), e.preventDefault() } })); var l = document.querySelector(".scroll-to-top"); l && window.addEventListener("scroll", (function () { var e = window.pageYOffset; l.style.display = e > 100 ? "block" : "none" })) }();

const change = (value) => { return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " рублей" }

checkTokens().then(async () => {
    const name = document.querySelector("#username");
    const costs = document.querySelector("#costs");
    const costsLink = document.querySelector("#costs-link")
    const netProfit = document.querySelector("#net-profit");
    const profit = document.querySelector("#profit");
    let costsSum, profitSum;
    const transactionTypes = ["Непредвиденные расходы", "Заработная плата", "Доставка", "Парковка", "Аутсорс", "Аренда", "Хоз/Канц Товары", "Грава"]
    
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
                    createLogicForChangeModal();
                }

                name.textContent = data.data.username;
            }
        }
    )

    sendFetchGet(
        `transactions/transaction_types?offset=0&limit=100`,
        getCookieValue("access"),
        (data) => {
            if (data.errors.length > 0) {
                alert(data.errors[0])
            } else {
                let typesArr = [];
                let transactionLink = "transactions/total?";

                transactionTypes.forEach((type) => {
                    data.data.items.forEach((typeObj) => {
                        if(type === typeObj.type){
                            typesArr.push(typeObj.id)
                            transactionLink += `types=${typeObj.id}&`
                        }
                    })
                });
                transactionLink+="is_today=true"

                sessionStorage.setItem("transaction_id", JSON.stringify(typesArr));
                sessionStorage.setItem("transaction_names", JSON.stringify(transactionTypes));

                sendFetchGet(
                    transactionLink,
                    getCookieValue("access"),
                    (data) => {
                        if (data.errors.length > 0) {
                            alert(data.errors[0])
                        } else { 
                            costsSum = data.data.total;

                            sendFetchGet(
                                "finances/",
                                getCookieValue("access"),
                                (data) => {
                                    if (data.errors.length > 0) {
                                        alert(data.errors[0])
                                    } else {
                                        profitSum = data.data.income_amount;
                                        profit.textContent = change(profitSum);
                                        costs.textContent = change(costsSum);

                                        netProfit.textContent = change(profitSum - Math.abs(costsSum));
                                        
                                        plugActivity(false);
                                        isMobile && checkMobile();
                                    }
                                }
                            )
                        }
                    }
                )
            }
        }
    )

    costsLink.addEventListener("click", () => {
        sessionStorage.setItem("transaction_type", "Расходы");
        window.location = `${window.location.origin}/budget`;
    });
});


const createLogicForChangeModal = () => {
    const changeModal = document.querySelector("#modal-editor");
    const changeModalInput = changeModal.querySelector(".modal-input-text");
    const changeModalBtns = changeModal.querySelectorAll("button");
    const changeModalTitle = changeModal.querySelector(".modal-title");
    const profit = document.querySelector("#profit-link");

    const modalActivity = (state) => {
        [changeModalInput, ...changeModalBtns].forEach((elem) => {
            elem.style.opacity = state ? 1 : 0.5;
            elem.style.pointerEvents = state ? "auto" : "none";
            elem.tabIndex = -1;
        })
    }

    const closeModal = () => {
        const backdrop = document.querySelector(".modal-backdrop");

        changeModalInput.value = "";
        changeModalInput.style.outline = "none";
        changeModal.classList.remove("show");
        changeModal.style.display = "none";
        backdrop.classList.remove("show");
        backdrop.style.zIndex = -1;
    }


    profit.addEventListener("click", () => {
        const backdrop = document.querySelector(".modal-backdrop");
        const cardValue = profit.querySelector(".card-value");

        changeModalInput.value = parseCurrency(cardValue.textContent);

        backdrop.style.zIndex = 2;
        backdrop.classList.add("show");
        changeModal.classList.add("show");
        changeModal.style.display = "block";
    })

    changeModalBtns.forEach((elem, i) => {
        elem.addEventListener("click", () => {
            if (i === 2) {
                if (changeModalInput.value.replace(/\+\-/g, "").length > 0) {
                    modalActivity(false);
                    changeModalInput.style.outline = "none";

                    sendFetchPut(
                        "finances/update",
                        getCookieValue("access"),
                        {
                            "income_amount" : Number(changeModalInput.value),
                        },
                        (data) => {
                            if (data.errors.length > 0) {
                                alert(data.errors[0])
                            } else {
                                const costs = document.querySelector("#costs");
                                const netProfit = document.querySelector("#net-profit");
                                const profit = document.querySelector("#profit");
                                profit.textContent = change(data.data.income_amount)

                                netProfit.textContent = change(
                                    data.data.income_amount
                                    -
                                    parseCurrency(costs.textContent)
                                );

                                modalActivity(true);
                                closeModal();
                            }
                        }
                    )
                    
                } else {
                    changeModalInput.style.outline = "1px solid red";
                }
            } else {
                closeModal();
            }
        })
    })
}