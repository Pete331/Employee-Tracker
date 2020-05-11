const mysql = require("mysql");
const inquirer = require("inquirer");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "employee_db",
});

// establish connection then run the start function which runs the initial inquirer prompts
connection.connect(function (err) {
  if (err) throw err;
  start();
});

function start() {
  inquirer
    .prompt({
      type: "list",
      name: "homeScreen",
      message: "What would you like to do?",
      choices: [
        "View all employees",
        "View all employees by department",
        "View all employees by manager",
        "Add employee",
        "Add manager",
        "Update employee role",
        "Update employee manager",
        "View all roles",
        "Add role",
        "Remove role",
        "Exit",
      ],
    })
    .then(function (answer) {
      switch (answer.homeScreen) {
        case "View all employees":
          console.log("yay");
          viewEmployees();
          break;
        case "View all employees by department":
          departmentView();
          break;
        case "View all employees by manager":
          managerView();
          break;
        case "Add employee":
          addEmployee();
          break;
        case "Add manager":
          addManager();
          break;
        case "Update employee role":
          updateEmployeeRole();
          break;
        case "Update employee manager":
          updateEmployeeManager();
          break;
        case "View all roles":
          viewAllRoles();
          break;
        case "Add role":
          addRole();
          break;
        case "Remove role":
          removeRole();
          break;
        case "Exit":
          connection.end();
          break;

        default:
          break;
      }
    });
}

function viewEmployees() {
  connection.query(
    "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name, role.salary, CONCAT(m.first_name, ' ', m.last_name) manager FROM employee INNER JOIN role ON (employee.role_id = role.id) INNER JOIN department ON (role.department_id = department.id) LEFT JOIN employee m ON m.id = employee.manager_id",
    function (err, results) {
      if (err) throw err;
      console.table(results);
      start();
    }
  );
}

function departmentView() {
  connection.query("SELECT * FROM department", function (err, results) {
    if (err) throw err;
    // console.log(results);
    inquirer
      .prompt({
        type: "list",
        name: "department",
        message: "Which department would you like to view?",
        choices: results.map((res) => res.name),
      })
      .then(function (answer) {
        console.log(answer.department);
        connection.query(
          `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name FROM employee INNER JOIN role ON (employee.role_id = role.id) INNER JOIN department ON (role.department_id = department.id AND department.name = '${answer.department}')`,
          function (err, results) {
            if (err) throw err;
            console.table(results);
            start();
          }
        );
      });
  });
}

function managerView() {
  connection.query(
    "SELECT employee.manager_id, CONCAT(m.first_name, ' ', m.last_name) manager FROM employee LEFT JOIN employee m ON m.id = employee.manager_id",
    function (err, results) {
      // if employee has no manager null is converted to a string
      console.log(results);
      results.forEach((element) => {
        if (element.manager === null) {
          element.manager = "No manager assigned";
        }
      });
      if (err) throw err;
      inquirer
        .prompt({
          type: "list",
          name: "manager",
          message: "Which manager would you like to view?",
          choices: results.map((res) => res.manager),
        })
        .then(function (answer) {
          const managerObj = results.find(
            (res) => res.manager === answer.manager
          );
          console.log(managerObj.manager_id);
          connection.query(
            `SELECT employee.id, employee.first_name, employee.last_name, employee.manager_id, CONCAT(m.first_name, ' ', m.last_name) manager FROM employee INNER JOIN role ON (employee.role_id = role.id) INNER JOIN department ON (role.department_id = department.id) LEFT JOIN employee m ON m.id = employee.manager_id WHERE employee.manager_id = ${managerObj.manager_id}`,
            function (err, results) {
              if (err) throw err;
              console.table(results);
              start();
            }
          );
        });
    }
  );
}

function addEmployee() {
  connection.query("SELECT * FROM role", function (err, results) {
    if (err) throw err;
    console.log(results);
    inquirer.prompt([
      {
        type: "item",
        name: "employeeFirstName",
        message: "What is the employee's first name?",
      },
      {
        type: "item",
        name: "employeeLastName",
        message: "What is the employee's last name?",
      },
      {
        type: "list",
        name: "employeeRole",
        message: "What is the employee's role?",
        choices: results.map((res) => res.title),
      },
    ]);
  });
}

function updateEmployeeRole() {
  connection.query(
    "SELECT employee.id, employee.first_name, employee.last_name, role.title FROM employee LEFT JOIN role ON (role.id = employee.role_id)",
    function (err, results) {
      if (err) throw err;
      inquirer
        .prompt({
          type: "list",
          name: "employeeRole",
          message: "Which employee role would you like to update?",
          choices: results.map(
            (res) =>
              res.id +
              " - " +
              res.first_name +
              " " +
              res.last_name +
              " - " +
              res.title
          ),
        })
        .then(function (answer) {
          // selects id of employee that was selected to be changed and stores as a variable
          const employeeSelectionId = answer.employeeRole.charAt(0);
          connection.query("SELECT id, title FROM role", function (
            err,
            results2
          ) {
            if (err) throw err;
            inquirer
              .prompt({
                type: "list",
                name: "employeeNewRole",
                message:
                  "Which new role do you want to assign to the employee?",
                choices: results2.map((res) => res.title),
              })

              .then(function (answer) {
                // returns role object that was selected for new role
                const objectRole = results2.find(
                  (res) => res.title === answer.employeeNewRole
                );
                connection.query(
                  `UPDATE employee SET role_id = ${objectRole.id} WHERE id = ${employeeSelectionId}`,
                  function (err) {
                    if (err) throw err;
                    console.log("The role was updated successfully!");
                    start();
                  }
                );
              });
          });
        });
    }
  );
}

function viewAllRoles() {
  connection.query("SELECT title, salary FROM role", function (err, results) {
    if (err) throw err;
    console.table(results);
    connection.end();
  });
}

function addRole() {
  connection.query(
    "SELECT department.id, name FROM department LEFT JOIN role ON (role.id = department.id)",
    function (err, results) {
      if (err) throw err;
      inquirer
        .prompt([
          {
            type: "item",
            name: "role_name",
            message: "What is the name of the role?",
          },
          {
            type: "item",
            name: "salary",
            message: `What is the salary of the role?`,
            validate: function (value) {
              if (isNaN(value) === false) {
                return true;
              }
              return false;
            },
          },
          {
            type: "list",
            name: "department",
            message: "What is the department id?",
            choices: results.map((res) => res.name),
          },
        ])
        .then(function (answer) {
          // returns object of selected department so that id can be selected and input into role table
          const objectRole = results.find(
            (res) => res.name === answer.department
          );
          connection.query(
            "INSERT INTO role SET ?",
            {
              title: answer.role_name,
              salary: answer.salary,
              department_id: objectRole.id,
            },
            function (err) {
              if (err) throw err;
              console.log("The role was created successfully!");
              start();
            }
          );
        });
    }
  );
}

function removeRole() {
  connection.query("SELECT * FROM role", function (err, results) {
    if (err) throw err;
    inquirer
      .prompt({
        type: "list",
        name: "removeRole",
        message: "Which role would you like to remove?",
        choices: results.map((res) => res.title),
      })
      .then(function (answer) {
        connection.query(
          `DELETE FROM role WHERE title='${answer.removeRole}'`,
          function (err, results) {
            if (err) throw err;
            console.log("The role was removed successfully!");
            start();
          }
        );
      });
  });
}
