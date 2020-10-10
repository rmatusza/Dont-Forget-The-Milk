document.addEventListener("DOMContentLoaded", e => {


  // display tasks after updating

  const displayTasks = async function(task) {


    // clear old tasks

    let oldTaskContainer = document.getElementById("task-list-container");
    let oldTasks = document.querySelectorAll(".task-container");
    if(oldTasks) {
      oldTasks.forEach(task => {
        oldTaskContainer.removeChild(task);

      })

    }

    // clear old script tags

    let scriptElement = document.querySelector('.script')
    if(scriptElement) {
      oldTaskContainer.removeChild(scriptElement)
    }

    // make a get request to the end-point below
    // check authorization of user by adding an authorization header in the GET request
    let listId = localStorage.getItem("CURRENT_LIST")

    const res = await fetch(`/api/lists/${listId}/tasks`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(
          "DFTM_USER_TOKEN"
        )}`
      }
    })
    if (res.status === 401) {
      window.location.href = "/log-in";
      return;
    }

    if(!res.ok) {
      throw res;
    }

    // extract tasks from the server response and dynamically generate HTML that is used to display the tasks

    const {allTasks}  = await res.json()

    const taskListContainer = document.querySelector(".task-list-container")
    allTasks.forEach(task => {

      // make all of the HTML elements for the buttons and tasks

      let buttonContainer = document.createElement('div')
      let deleteButtonContainer = document.createElement('div')
      let updateButtonContainer = document.createElement('div')
      buttonContainer.classList.add("buttons-container")
      deleteButtonContainer.classList.add("delete-button-container")
      updateButtonContainer.classList.add("update-button-container")

      let deleteButton = document.createElement('button')
      let updateButton = document.createElement('button')

      deleteButton.setAttribute("type", "submit")
      updateButton.setAttribute("type", "submit")
      deleteButton.dataset.id = task.id
      updateButton.dataset.id = task.id
      deleteButton.classList.add("delete-task-btn")
      updateButton.classList.add("update-task-btn")
      deleteButton.innerHTML = "Delete"
      updateButton.innerHTML = "Update"

      deleteButtonContainer.appendChild(deleteButton)
      updateButtonContainer.appendChild(updateButton)

      buttonContainer.appendChild(deleteButtonContainer)
      buttonContainer.appendChild(updateButtonContainer)

      const taskContainer = document.createElement('div');
      taskContainer.classList.add("task-container")
      taskContainer.dataset.taskId = task.id
      const taskItem = document.createElement('div')
      taskItem.classList.add("task");
      taskItem.setAttribute("id", `${task.id}`)
      taskItem.innerHTML = task.taskName
      taskContainer.appendChild(taskItem)
      taskContainer.appendChild(buttonContainer)
      taskListContainer.appendChild(taskContainer)
    });

    // Set up event listeners on tasks so that information can be displayed after clicking on them

    const script = document.createElement('script')
    script.setAttribute('src', './js/test.js')
    script.classList.add('script')
    taskListContainer.appendChild(script)

    // set up event listeners on delete buttons

    const scriptForDeleteButtons = document.createElement('script')
    scriptForDeleteButtons.setAttribute('src', './js/delete-tasks.js')
    scriptForDeleteButtons.classList.add('script')
    taskListContainer.appendChild(scriptForDeleteButtons)



  }

 //---------------------------------------------------------------------------------

  // delete a task on the back-end and render the change on the front-end
  const deleteTask = async function (taskId) {
    let listId = localStorage.getItem("CURRENT_LIST")
    const body = {taskId}


    try{
      const res = await fetch(`/api/lists/${listId}/tasks/delete-task`, {
        method: 'DELETE',
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem(
            "DFTM_ACCESS_TOKEN"
          )}`,
        }
      })

      if (res.status === 401) {
        window.location.href = "/log-in";
        return;
      }

      if(!res.ok) {
        throw res;
      }

      const data  = await res.json()
      console.log(data.deletedTask)
      const deletedTask = document.querySelector(`[data-task-id="${data.deletedTask}"]`)

      deletedTask.remove()

    } catch(err) {
      console.error(err)
    }

  }

  //-----------------------------------------------------------------------------

  // Update tasks on the back-end and render the change on the front-end

  let taskId;
  const runTaskForm = function() {

    const updateTaskForm = document.getElementById("edit-task-form")
    console.log(updateTaskForm)
    updateTaskForm.addEventListener("submit", async(e) => {
      editTaskForm.style.display = "none"
      e.preventDefault();
      e.stopImmediatePropagation();

      const formData = new FormData(updateTaskForm)
      const taskName = formData.get("taskName")
      const dueDate = formData.get("dueDate")
      const description = formData.get("description")

      const body = {taskName, dueDate, description, taskId}

      try{
        const res = await fetch(`api/tasks/${taskId}/update-task`, {
          method: "PUT",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem(
              "DFTM_ACCESS_TOKEN"
              )}`,
            }
          })

        //Functionality to display increment overdue tasks span if new task has a due date that has passed.
        // console.log("DueDate", new Date(dueDate))
        // console.log(new Date())
        if(new Date(dueDate) < new Date()){
          const overdueTasksSpan = document.querySelector(".overdue-tasks-span")
          let overdueTasksValue = overdueTasksSpan.innerHTML
          overdueTasksSpan.innerHTML = Number(`${overdueTasksValue}`) + 1

        }
        // console.log(res)
        if (res.status === 401) {
          window.location.href = "/log-in";
          return;
        }
        if (!res.ok) {
          throw res;
        }

        const { task } = await res.json()

        await displayTasks(task)


      }catch(err) {
        console.error(err)
      }
    })
  }

  //--------------------------------------------------------------------------------

  // functionality for deleting a task on the front end

  const tasksContainer = document.querySelector('.task-list-container');
  // console.log(tasksContainer)

  tasksContainer.addEventListener("click", e=> {
    e.preventDefault();
    e.stopPropagation();
    if(e.target.className.startsWith('delete')) {

      deleteTask(e.target.dataset.id)

      //Functionality to subtract one from allTasks if a task is successfully deleted
      const allTasksSpan = document.querySelector(".total-task-span")
      let allTasksValue = allTasksSpan.innerHTML
      allTasksSpan.innerHTML = Number(`${allTasksValue}`) - 1

    } else if (e.target.className.startsWith('update')) {
      taskId = e.target.dataset.id
      const editTaskForm = document.querySelector(".edit-task-form-holder")
      editTaskForm.style.display = "block"
      runTaskForm()

    }
    return;
  })
})
