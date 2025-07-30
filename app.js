document.addEventListener('DOMContentLoaded', () => {
    const summarySection = document.getElementById('summary-section');
    const expenseList = document.getElementById('expense-list');
    const expenseForm = document.getElementById('expense-form');
    const expenseModalEl = document.getElementById('expense-modal');
    const expenseModal = new bootstrap.Modal(expenseModalEl);
    const expenseModalLabel = document.getElementById('expense-modal-label');
    const deleteButton = document.getElementById('delete-button');
    const nameForm = document.getElementById('name-form');
    const nameModal = new bootstrap.Modal(document.getElementById('name-modal'));

    let members = JSON.parse(localStorage.getItem('members')) || [
        { id: 1, name: 'Aさん' },
        { id: 2, name: 'Bさん' },
        { id: 3, name: 'Cさん' },
        { id: 4, name: 'Dさん' }
    ];
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    const saveState = () => {
        localStorage.setItem('members', JSON.stringify(members));
        localStorage.setItem('expenses', JSON.stringify(expenses));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
    };

    const render = () => {
        renderSummary();
        renderExpenses();
        populatePayerSelect();
    };

    const renderSummary = () => {
        summarySection.innerHTML = '';
        const balances = calculateBalances();
        members.forEach(member => {
            const balance = balances[member.id] || 0;
            const card = document.createElement('div');
            card.className = 'col-md-3 col-6 mb-3';
            const balanceClass = balance < 0 ? 'minus' : 'plus';
            card.innerHTML = `
                <div class="card summary-card ${balanceClass}">
                    <div class="card-body">
                        <h5 class="card-title" data-member-id="${member.id}" style="cursor: pointer;">${member.name}</h5>
                        <p class="card-text">${formatCurrency(balance)}</p>
                    </div>
                </div>
            `;
            summarySection.appendChild(card);
        });
    };

    const calculateBalances = () => {
        const balances = {};
        members.forEach(m => balances[m.id] = 0);

        if (members.length > 0) {
            expenses.forEach(expense => {
                const amount = expense.amount;
                const payerId = expense.payerId;
                const share = amount / members.length;

                members.forEach(member => {
                    if (member.id === payerId) {
                        balances[member.id] += amount - share;
                    } else {
                        balances[member.id] -= share;
                    }
                });
            });
        }
        return balances;
    };

    const renderExpenses = () => {
        expenseList.innerHTML = '';
        const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
        sortedExpenses.forEach(expense => {
            const payer = members.find(m => m.id === expense.payerId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(expense.date).toLocaleString('ja-JP')}</td>
                <td>${expense.description}</td>
                <td>${payer ? payer.name : '不明'}</td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-expense-button" data-id="${expense.id}">編集</button>
                </td>
            `;
            expenseList.appendChild(row);
        });
    };

    const populatePayerSelect = () => {
        const payerSelect = document.getElementById('expense-payer');
        const currentPayer = payerSelect.value;
        payerSelect.innerHTML = '';
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            payerSelect.appendChild(option);
        });
        if (currentPayer) {
            payerSelect.value = currentPayer;
        }
    };

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('expense-id').value;
        const date = document.getElementById('expense-date').value;
        const description = document.getElementById('expense-description').value;
        const amount = parseInt(document.getElementById('expense-amount').value, 10);
        const payerId = parseInt(document.getElementById('expense-payer').value, 10);

        if (id) {
            const expense = expenses.find(exp => exp.id == id);
            if (expense) {
                expense.date = date;
                expense.description = description;
                expense.amount = amount;
                expense.payerId = payerId;
            }
        } else {
            const newExpense = {
                id: Date.now(),
                date,
                description,
                amount,
                payerId
            };
            expenses.push(newExpense);
        }
        saveState();
        render();
        expenseModal.hide();
    });

    expenseModalEl.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const id = button ? button.getAttribute('data-id') : null;
        
        expenseForm.reset();
        document.getElementById('expense-id').value = '';
        deleteButton.classList.add('d-none');

        if (id) {
            expenseModalLabel.textContent = '費用の編集';
            const expense = expenses.find(exp => exp.id == id);
            if (expense) {
                document.getElementById('expense-id').value = expense.id;
                document.getElementById('expense-date').value = expense.date ? new Date(expense.date).toISOString().slice(0, 16) : '';
                document.getElementById('expense-description').value = expense.description;
                document.getElementById('expense-amount').value = expense.amount;
                document.getElementById('expense-payer').value = expense.payerId;
                deleteButton.classList.remove('d-none');
            }
        } else {
            expenseModalLabel.textContent = '費用の追加';
            document.getElementById('expense-date').value = new Date().toISOString().slice(0, 16);
        }
    });

    deleteButton.addEventListener('click', () => {
        const id = document.getElementById('expense-id').value;
        expenses = expenses.filter(exp => exp.id != id);
        saveState();
        render();
        expenseModal.hide();
    });

    summarySection.addEventListener('click', (e) => {
        const title = e.target.closest('.card-title');
        if (title) {
            const memberId = title.getAttribute('data-member-id');
            const member = members.find(m => m.id == memberId);
            if (member) {
                document.getElementById('member-id').value = member.id;
                document.getElementById('member-name').value = member.name;
                nameModal.show();
            }
        }
    });

    nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('member-id').value;
        const newName = document.getElementById('member-name').value;
        const member = members.find(m => m.id == id);
        if (member) {
            member.name = newName;
        }
        saveState();
        render();
        nameModal.hide();
    });

    expenseList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-expense-button')) {
            const id = e.target.getAttribute('data-id');
            const triggerButton = document.createElement('button');
            triggerButton.setAttribute('data-bs-toggle', 'modal');
            triggerButton.setAttribute('data-bs-target', '#expense-modal');
            triggerButton.setAttribute('data-id', id);
            document.body.appendChild(triggerButton);
            triggerButton.click();
            document.body.removeChild(triggerButton);
        }
    });

    render();

    document.getElementById('export-csv-button').addEventListener('click', () => {
        // 費用一覧CSV
        let expense_csv = '日時,用途,支払った人,金額\n';
        expenses.forEach(expense => {
            const payer = members.find(m => m.id === expense.payerId);
            expense_csv += `${new Date(expense.date).toLocaleString('ja-JP')},${expense.description},${payer ? payer.name : '不明'},${expense.amount}\n`;
        });

        let expense_blob = new Blob(["\uFEFF" + expense_csv], { type: 'text/csv;charset=utf-8;' });
        let expense_link = document.createElement('a');
        expense_link.href = URL.createObjectURL(expense_blob);
        expense_link.download = 'warikan_expenses.csv';
        expense_link.click();

        // 清算サマリーCSV
        const balances = calculateBalances();
        let summary_csv = 'メンバー,収支\n';
        members.forEach(member => {
            const balance = balances[member.id] || 0;
            summary_csv += `${member.name},${balance}\n`;
        });

        let summary_blob = new Blob(["\uFEFF" + summary_csv], { type: 'text/csv;charset=utf-8;' });
        let summary_link = document.createElement('a');
        summary_link.href = URL.createObjectURL(summary_blob);
        summary_link.download = 'warikan_summary.csv';
        summary_link.click();
    });
});