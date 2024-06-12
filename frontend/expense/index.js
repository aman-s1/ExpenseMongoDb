const errorBox = document.querySelector('#error-box');
const expensesList = document.querySelector('#expenses-list');
const totalExpenses = document.querySelector('.total-expenses');
const sumExpenses = document.querySelector('#sumexp');
const expensesPieChart = document.getElementById('expensesPieChart').getContext('2d');
const downloadFile = document.getElementById('downloadexpense');

const PAGE_SIZE = 7;

async function addexpense(e) {
    try {
        e.preventDefault();

        const expenseDetails = {
            expenseamount: e.target.amount.value,
            description: e.target.description.value,
            category: e.target.category.value
        };
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3000/expense/addexpense', expenseDetails , { headers: {"Authorization" : token}});

        if (response.status === 201) {
            addNewExpenseToUI(response.data.expense[0]);
        } else {
            throw new Error('Failed to add Expense');
        }
    } catch (err) {
        if(err.response && err.response.data && err.response.data.err === 'Expense Amount is Missing')
        {
            errorBox.innerHTML = '';
            errorBox.innerHTML += 'Expense Amount is Missing';
        }
        else if(err.response && err.response.data && err.response.data.err === 'Empty Parameters')
        {
            errorBox.innerHTML = '';
            errorBox.innerHTML += 'Empty Parameters';
        }
        else
        {
            showError(err);
        }
        console.log(err);
    }
};

function showpremusermsg() {
    document.getElementById('rzp-button').style.display = 'none';
    document.getElementById('prem-head').style.display = 'block';
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

window.addEventListener('DOMContentLoaded', async () => {
    let currentPage = 1;
    const token = localStorage.getItem('token');
    const decodedToken = parseJwt(token);
    console.log(decodedToken);

    document.getElementById('user-name').innerHTML = 'Hi ' + decodedToken.name + ',';
    document.getElementById('user-name').style.color = '#1565c0';
    try {
        const response = await axios.get(`http://localhost:3000/checkpremium/${decodedToken.userId}`, {
            headers: { "Authorization": token }
        });

        if (response.status === 200) {
            const { isPremium } = response.data;

            if (isPremium) {
                showpremusermsg();
                downloadFile.style.display = 'block';
                showLeaderboard(); // Show the leaderboard if the user is premium
            }
            else{
                downloadFile.style.display = 'none';
            }
        }
        
        loadExpenses(currentPage);

        document.getElementById('prev-page-btn').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadExpenses(currentPage);
            }
        });

        document.getElementById('next-page-btn').addEventListener('click', () => {
            const totalPages = 10;
            if (currentPage < totalPages) {
                currentPage++;
                loadExpenses(currentPage);
            }
        });
    } catch (error) {
        console.error(error);
        showError(error);
    }
});

async function loadExpenses(currentPage = 1) {
    const token = localStorage.getItem('token');

    try {
        const response = await axios.get(`http://localhost:3000/expense/getexpenses?page=${currentPage}&pageSize=${PAGE_SIZE}`, {
            headers: { "Authorization": token }
        });

        if (response.status === 200) {
            const expenses = response.data.expenses;
            const expensesWrapper = document.getElementById('expenses-list');
            expensesWrapper.innerHTML = '';

            expenses.forEach(expense => {
                addNewExpenseToUI(expense);
            });
        } else {
            throw new Error('Failed to fetch expenses');
        }
    } catch (error) {
        showError(error);
    }
}

async function addNewExpenseToUI(expense) {
    const parentElement = document.getElementById('expenses-list');
    const expenseElemId = `expense-${expense._id}`;
    
    const listItem = document.createElement('li');
    listItem.id = expenseElemId;
    listItem.style.fontStyle = 'italic';
    listItem.innerHTML = `
        ${expense.expenseamount} - ${expense.category} - ${expense.description}
        <button id="delete-${expense._id}" style="padding: 5px 5px; background-color: #1565c0; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;">
            Delete Expense
        </button>
        <br><br>`;
    
    parentElement.appendChild(listItem);
    
    document.getElementById(`delete-${expense._id}`).addEventListener('click', (event) => {
        deleteExpense(event, expense._id);
    });

    await updateTotalExpenseSum();
}


async function deleteExpense(e, expenseid) {
    try {
        const token = localStorage.getItem('token');
        console.log(expenseid);
        const response = await axios.delete(`http://localhost:3000/expense/deleteexpense/${expenseid}`, { headers: {"Authorization" : token}});
        
        if (response.status === 200) {
            removeExpenseFromUI(expenseid);
            await updateTotalExpenseSum();
        } else {
            throw new Error('Failed to delete expense');
        }
    } catch (err) {
        showError(err);
    }
}

function removeExpenseFromUI(expenseId) {
    const expenseElemId = `expense-${expenseId}`;
    const expenseElement = document.getElementById(expenseElemId);
    
    if (expenseElement) {
        expenseElement.remove();
    }
};

function showError(err) {
    console.error(err);

    if (errorBox.innerHTML !== '') {
        errorBox.innerHTML = '';
    }

    if (err.response && err.response.data && err.response.data.err) {
        errorBox.innerHTML += err.response.data.err;
    } else if (err.message) {
        errorBox.innerHTML += err.message;
    } else {
        errorBox.innerHTML += 'An error occurred.';
    }
};

async function download() {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.get('http://localhost:3000/expense/download', { headers: { "Authorization": token } });

        if (response.status === 200) {
            // The backend is essentially sending a download link
            // which, if we open in the browser, the file would download
            const a = document.createElement("a");
            a.href = response.data.fileURL;
            a.download = 'myexpense.csv';
            a.click();
        } else {
            throw new Error(response.data.message);
        }
    } catch (err) {
        showError(err);
    }
}


function showLeaderboard() {
    const inputElement = document.createElement('input');
    inputElement.type = "button";
    inputElement.style.backgroundColor = "#1565c0";
    inputElement.style.color = "#ffffff";
    inputElement.style.cursor = "pointer";
    inputElement.value = 'Show Leaderboard';
    inputElement.onclick = async () => {
        const token = localStorage.getItem('token');
        const userLeaderBoardArray = await axios.get('http://localhost:3000/premium/showLeaderBoard', { headers: { "Authorization": token } });
        console.log(userLeaderBoardArray);

        var leaderboardElem = document.getElementById('leaderboard');
        leaderboardElem.innerHTML += '<h3 style="color:#1565c0;"> Leader Board </h3>';
        userLeaderBoardArray.data.forEach((userDetails) => {
            leaderboardElem.innerHTML += `<li style='color: #1565c0; font-size: small; font-style: italic;'>Name - ${userDetails.name}, Total Expenses - ${userDetails.totalExpenses}</li>`;
        });
        
    }
    document.getElementById('message').appendChild(inputElement);
}

document.getElementById('rzp-button').onclick = async function (e) {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:3000/purchase/premiummembership', { headers: { "Authorization": token } });
    console.log(response);
    var options =
    {
        "key": response.data.key_id,
        "order_id": response.data.order.id,
        "handler": async function (response) {
            await axios.post('http://localhost:3000/purchase/updatetransactionstatus', {
                order_id: options.order_id,
                payment_id: response.razorpay_payment_id,
            }, { headers: { "Authorization": token } })

            alert('You are a Premium User Now');
            showpremusermsg();
            showLeaderboard();
            localStorage.setItem('token',res.data.token);
        },
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
    e.preventDefault();

    rzp1.on('payment.failed', function (response){
        console.log(response);
        alert('Something went wrong');
    });
};


async function getTotalExpenseSum() {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.get('http://localhost:3000/expense/gettotalexpensesum', { headers: { "Authorization": token } });
        await updatePieChart();
        return response.data.sum || 0;
    } catch (error) {
        console.error(error);
        return 0;
    }
};

async function updateTotalExpenseSum() {
    const sum = await getTotalExpenseSum();
    sumExpenses.textContent = `Total Expenses: ${sum}`;
};

async function updatePieChart() {
    const token = localStorage.getItem('token');

    try {
        // Fetch total expenses
        // const totalExpensesResponse = await axios.get('http://localhost:3000/expense/gettotalexpensesum', { headers: { "Authorization": token } });
        // const totalExpenses = totalExpensesResponse.data.sum || 0;

        // console.log('Total Expenses:', totalExpenses);

        // Fetch expenses by categories
        const expensesByCategoryResponse = await axios.get('http://localhost:3000/expense/getexpensesbycategory', { headers: { "Authorization": token } });
        const expensesByCategory = expensesByCategoryResponse.data.expenses || [];

        console.log('Expenses by Category:', expensesByCategory);

        // Extract category names and amounts
        const categoryNames = expensesByCategory.map(expense => expense._id);
        const categoryAmounts = expensesByCategory.map(expense => expense.sum);

        // Update the pie chart
        new Chart(expensesPieChart, {
            type: 'pie',
            data: {
                labels: categoryNames,
                datasets: [{
                    data: categoryAmounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                }],
            },
            options: {
                title: {
                    display: true,
                    text: `Total Expenses: ${totalExpenses}`,
                },
            },
        });
    } catch (error) {
        console.error(error);
    }
};