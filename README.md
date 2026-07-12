# Role-Based Access Control Dashboard

Next.js + Supabase + Shadcn UI dashboard for managing members, roles, permissions, and tasks. Live demo: [rbac-management-dashboard-nine.vercel.app](https://rbac-management-dashboard-nine.vercel.app)

## Concept

Role-Based Access Control (RBAC) regulates access based on each user's role. This project applies that model so you can assign permissions and access levels without hard-coding them per user.

## Project Structure

The project is structured as follows:
- `components/`: Contains the React components used in the frontend.
- `actions/`: Contains the API endpoints for each component, stored in `index.ts` files.
- `pages/`: Contains the Next.js pages.
- `styles/`: Contains the styling files.
- `utils/`: Contains utility functions and helpers.

## Setup Details

To set up the project, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/an1ket-s1ngh/rbac-management-dashboard.git
    ```

2. Navigate to the project directory:
    ```bash
    cd rbac-dashboard
    ```

3. Install the dependencies:
    ```bash
    npm install
    ```

4. Set up the environment variables for Supabase in the `.env.local` file:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    SERVICE_ROLE=your-service-role-key-for-admin-access-to-database
    SUPABASE_DB_PASSWORD=your-password-for-the-database
    ```

5. Run the development server:
    ```bash
    npm run dev
    ```

## API Details

The API endpoints are stored in the `index.ts` file within each `actions` folder for every component of the project. These endpoints handle various operations such as fetching data, updating records, and managing user roles and permissions.

### List of APIs

- **Auth APIs**
  - `POST loginWithEmailAndPassword(data)`: log in as a user.
  - `POST signUp(data)`: sign up as a new_user.
  - `POST logout()`: Log out a user.

- **Member APIs**
  - `GET readMembers()`: Fetch all members.
  - `GET readMemberNameID()`: Fetch user_id and name of each member
  - `GET readMemberNameByID(member_id)`: Fetch member name using member_id
  - `POST createMember(data)`: Add a new member with data fields passed.
  - `PUT updateMemberBasicById(id, data)`: Update advanced member details using user_id
  - `PUT updateMemberAdvanceById(permission_id, user_id, data)`: Update advanced member details using user_id and permission_id.
  - `PUT updateMemberAccountById(user_id, data)`: Update member account details using user_id.
  - `DELETE deleteMemberById(user_id)`: Delete a member using user_id.

- **Task APIs**
  - `GET readTasks()`: Fetch all tasks.
  - `POST createTask(data)`: Add a new task with the data fields passed.
  - `PUT updateTaskById(data)`: Update task details with the data fields passed, for non manager and non admin roles.
  - `PUT updateTaskByIdElevated(data)`: Update task details with the data fields passed, for manager and admin roles (allows changing the assignee of the task)
  - `DELETE deleteTaskById(task_id)`: Delete a task by using task_id.

### Supabase APIs

- **Auth APIs**
  - `POST supabase.auth.signInWithPassword(data)`: authenticate and log in as a user.
  - `POST supabase.auth.admin.createUser(data)`: create a user in the database.
  - `POST supabase.auth.signOut()`: Log out a user.
  - `GET createSupbaseServerClientReadOnly()`: create a read only server client by fetching cookies.
  - `GET createSupabaseServerClient()`: create a server client by fetching, setting and deleting cookies.
  - `GET createSupabaseAdmin()`: create an admin server client with auto refreshed tokens and persisting session.

- **Database APIs**
  - `GET supabase.from("table_name").select(data).eq("equality constraint")`: Fetch data from the given table.
  - `POST supabase.from("table_name").insert(data).eq("equality constraint")`: Insert given data into the given table.
  - `PUT supabase.from("table_name").update(data).eq("equality constraint")`:  Update given data in the given table.
  - `DELETE supabase.from("table_name").delete(data).eq("equality constraint")`: Delete given data from the given table.

## Technology Stack

- **Next.js**: Used for the frontend development.
- **Supabase**: Serves as the backend database, handles authentication, and allows managing roles by providing api's for fetching details from the database.
- **ShadcnUI**: Provides UI components and basic design elements.
- **Zustand**: Used for state management.
- **ZodResolver**: Used for form validations.

## Database Schema

Stores each member's information in the `member` table and their assigned roles and status in the `permission` table. The `task` table stores each task along with details such as who created it, when it was created, and its completion status.

## Conclusion

This RBAC Dashboard project leverages modern technologies to provide a robust and scalable solution for managing user roles and permissions. By following the setup instructions, you can quickly get the project up and running and start customizing it to fit your needs.