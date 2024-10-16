if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('Service Worker registrado com sucesso:', registration))
            .catch(error => console.error('Falha ao registrar o Service Worker:', error));
    });
}

let editingIndex = -1;

document.getElementById('add-expense').addEventListener('click', addExpense);

async function addExpense() {
    const { description, quantity, amount, currencyFrom, currencyTo } = getFormValues();

    if (!description || !quantity || !amount) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        const rate = await fetchExchangeRate(currencyFrom, currencyTo);
        const convertedAmount = calculateConvertedAmount(quantity, amount, rate);

        const expense = createExpense(description, quantity, amount, currencyFrom, currencyTo, convertedAmount);

        let expenses = getExpensesFromLocalStorage();
        if (editingIndex === -1) {
            expenses.push(expense);
        } else {
            expenses[editingIndex] = expense;
            editingIndex = -1;
        }

        saveExpensesToLocalStorage(expenses);
        clearForm();
        displayExpenses();
    } catch (error) {
        console.error('Erro ao adicionar despesa:', error);
        alert('Erro ao obter taxa de câmbio. Tente novamente mais tarde.');
    }
}

function getFormValues() {
    return {
        description: document.getElementById('expense-description').value,
        quantity: parseFloat(document.getElementById('expense-quantity').value),
        amount: parseFloat(document.getElementById('expense-amount').value),
        currencyFrom: document.getElementById('currency-from').value,
        currencyTo: document.getElementById('currency-to').value
    };
}

async function fetchExchangeRate(currencyFrom, currencyTo) {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currencyFrom}`);
    const data = await response.json();
    return data.rates[currencyTo];
}

function calculateConvertedAmount(quantity, amount, rate) {
    return (quantity * amount * rate).toFixed(2);
}

function createExpense(description, quantity, amount, currencyFrom, currencyTo, convertedAmount) {
    return { description, quantity, amount, currencyFrom, currencyTo, convertedAmount: parseFloat(convertedAmount) };
}

function getExpensesFromLocalStorage() {
    return JSON.parse(localStorage.getItem('expenses')) || [];
}

function saveExpensesToLocalStorage(expenses) {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function clearForm() {
    document.getElementById('expense-description').value = '';
    document.getElementById('expense-quantity').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('currency-from').value = 'BRL';
    document.getElementById('currency-to').value = 'BRL';
}

function displayExpenses() {
    const expenses = getExpensesFromLocalStorage();
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';

    let totalOrigin = 0;
    let totalDestination = 0;

    expenses.forEach((expense, index) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');

        const textSpan = document.createElement('span');
        textSpan.textContent = `${expense.description} (Qtd. ${expense.quantity}): ${expense.amount} ${expense.currencyFrom} => ${expense.convertedAmount} ${expense.currencyTo}`;

        const editButton = createIconButton('edit-button', ['fas', 'fa-pencil-alt'], () => editExpense(index));
        const removeButton = createIconButton('remove-button', ['fas', 'fa-trash'], () => removeExpense(index));

        li.appendChild(textSpan);
        li.appendChild(editButton);
        li.appendChild(removeButton);
        expenseList.appendChild(li);

        totalOrigin += (expense.amount * expense.quantity);
        totalDestination += expense.convertedAmount;
    });

    document.getElementById('total-origin').textContent = totalOrigin.toFixed(2);
    document.getElementById('total-destination').textContent = totalDestination.toFixed(2);
}

function createIconButton(buttonClass, iconClasses, onClickHandler) {
    const button = document.createElement('button');
    button.classList.add(buttonClass);
    button.onclick = onClickHandler;

    const icon = document.createElement('i');
    icon.classList.add(...iconClasses);

    button.appendChild(icon);
    return button;
}

function editExpense(index) {
    const expenses = getExpensesFromLocalStorage();
    const expense = expenses[index];
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-quantity').value = expense.quantity;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('currency-from').value = expense.currencyFrom;
    document.getElementById('currency-to').value = expense.currencyTo;

    editingIndex = index;
}

function removeExpense(index) {
    let expenses = getExpensesFromLocalStorage();
    expenses.splice(index, 1);
    saveExpensesToLocalStorage(expenses);
    displayExpenses();
}

window.onload = displayExpenses;
document.addEventListener('DOMContentLoaded', displayExpenses);
