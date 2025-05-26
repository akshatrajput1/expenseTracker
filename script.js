const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const totalAmount = document.getElementById("totalAmount");
const filterCategory = document.getElementById("filterCategory");
const darkModeToggle = document.getElementById("darkModeToggle");
const exportCSVBtn = document.getElementById("exportCSV");
const ctx = document.getElementById("expenseChart").getContext("2d");

let expenseChart; // Chart instance

window.onload = () => {
  loadExpenses();
  loadDarkModePref();
};

// Dark Mode Toggle
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  // Save preference
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
  } else {
    localStorage.setItem("darkMode", "disabled");
  }
});

function loadDarkModePref() {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
  }
}

// Load expenses from localStorage
function loadExpenses() {
  const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  expenses.forEach(({ description, category, amount }) => {
    addExpenseRow(description, category, amount);
  });
  updateTotal();
  updateChart();
}

function saveExpenses() {
  const expenses = [];
  expenseList.querySelectorAll("tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    expenses.push({
      description: cells[0].textContent,
      category: cells[1].textContent,
      amount: cells[2].textContent.replace("₹", ""),
    });
  });
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function addExpenseRow(description, category, amount) {
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
    <td>${description}</td>
    <td>${category}</td>
    <td>₹${parseFloat(amount).toFixed(2)}</td>
    <td><button class="delete-btn">Delete</button></td>
  `;

  expenseList.appendChild(newRow);

  // Delete button event
  newRow.querySelector(".delete-btn").addEventListener("click", () => {
    newRow.remove();
    saveExpenses();
    updateTotal();
    updateChart();
  });

  updateTotal();
  updateChart();
}

function updateTotal() {
  let total = 0;
  expenseList.querySelectorAll("tr").forEach((row) => {
    const amount = parseFloat(
      row.children[2].textContent.replace("₹", "")
    );
    total += amount;
  });
  totalAmount.textContent = `Total Expenses: ₹${total.toFixed(2)}`;
}

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const amount = document.getElementById("amount").value;

  if (!description || !category || !amount || amount <= 0) {
    alert("Please enter valid inputs.");
    return;
  }

  addExpenseRow(description, category, amount);
  saveExpenses();
  expenseForm.reset();
});

// Filter expenses by category
filterCategory.addEventListener("change", () => {
  const selected = filterCategory.value;
  const rows = expenseList.querySelectorAll("tr");

  rows.forEach((row) => {
    const category = row.children[1].textContent;
    if (selected === "All" || category === selected) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });

  updateTotalFiltered(selected);
  updateChart(selected);
});

function updateTotalFiltered(selectedCategory) {
  let total = 0;
  expenseList.querySelectorAll("tr").forEach((row) => {
    const category = row.children[1].textContent;
    if (selectedCategory === "All" || category === selectedCategory) {
      const amount = parseFloat(
        row.children[2].textContent.replace("₹", "")
      );
      total += amount;
    }
  });
  totalAmount.textContent = `Total Expenses: ₹${total.toFixed(2)}`;
}

// Export to CSV functionality
exportCSVBtn.addEventListener("click", () => {
  const rows = [["Description", "Category", "Amount"]];
  expenseList.querySelectorAll("tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (row.style.display === "none") return; // skip hidden rows from filter
    rows.push([
      cells[0].textContent,
      cells[1].textContent,
      cells[2].textContent.replace("₹", ""),
    ]);
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const now = new Date();
  link.setAttribute(
    "download",
    `expenses_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Chart.js - Show category-wise expense breakdown
function updateChart(selectedCategory = "All") {
  // Aggregate amounts by category
  const categoryMap = {};

  expenseList.querySelectorAll("tr").forEach((row) => {
    if (row.style.display === "none") return; // respect filter
    const category = row.children[1].textContent;
    const amount = parseFloat(row.children[2].textContent.replace("₹", ""));

    if (selectedCategory !== "All" && category !== selectedCategory) return;

    categoryMap[category] = (categoryMap[category] || 0) + amount;
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Expenses",
          data: data,
          backgroundColor: [
            "#4caf5d",
            "#f44336",
            "#2196f3",
            "#ff9800",
            "#9c27b0",
          ],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: document.body.classList.contains("dark-mode")
              ? "#ddd"
              : "#333",
          },
        },
      },
    },
  });
}

// Re-update chart colors on dark mode toggle (optional)
darkModeToggle.addEventListener("click", () => {
  setTimeout(() => {
    updateChart(filterCategory.value);
  }, 100);
});
