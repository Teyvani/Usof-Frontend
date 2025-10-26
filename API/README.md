# USOF Backend API
## Description
Usof — a backend API for question and answer platform similar to StackOverflow. It allows users to post questions, provide answers through comments, like/dislike content, follow posts, organize content in collections, and report inappropriate content.
## Technologies Used
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **bcrypt** - Password hashing
- **express-session** - Session management
- **nodemailer** - Email notifications
- **multer** - File upload handling
## Installation and Setup
### Prerequisites
- Node.js
- MySQL server
### Installation Steps
1. **Clone the repository**
```bash
git clone https://github.com/Teyvani/Usof.git
cd usof-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create database**
```bash
mysql -u root -p < usof_db.sql
```

4. **Start the server**
```bash
npm start
```

Server will run on `http://localhost:3000`

## Project Structure

```
usof-backend/
├── controllers/
│   ├── categoryController.js
│   ├── collectionController.js
│   ├── commentController.js
│   ├── followController.js
│   ├── likeController.js
│   ├── notificationController.js
│   ├── postController.js
│   ├── reportController.js
│   └── userController.js
├── models/
│   ├── categoryModel.js
│   ├── collectionModel.js
│   ├── commentModel.js
│   ├── followModel.js
│   ├── likeModel.js
│   ├── notificationModel.js
│   ├── postModel.js
│   ├── reportModel.js
│   └── userModel.js
├── middleware/
│   ├── authentication.js
│   ├── mainChecker.js
│   ├── middleChecker.js
│   └── validation.js
├── routes/
│   └── mainRouter.js
├── uploads/ (Creates automatically when app running)
├── config.json
├── db.js
├── index.js
├── package.json
└── usof_db.sql
```
## API Endpoints
### Authentication Module
#### Register New User
```http
POST /api/auth/register
Content-type: application/json
{
  "login": "test_user",
  "full_name": "Test User",
  "password": "testPassword123",
  "confirm_password": "testPassword123",
  "email": "test@example.com"
}
```
**Response:** 201 Created
```json
{
  "message": "User registered. Please confirm your email."
}
```
**Algorithm:**
1. Validate input data
2. Check if login/email already exists
3. Hash password with bcrypt
4. Generate email confirmation token
5. Save user to database with `email_confirmed: false`
6. Send confirmation email with token
7. Return success message
---
#### Confirm Email
```http
GET /api/auth/confirm-email?token={confirmation_token}
```
**Response:** 200 OK
```json
{
  "message": "Email confirmed successfully."
}
```
**Algorithm:**
1. Check if token given
2. Find user by token
3. Set `email_confirmed: true`
4. Return success message
---
#### Send Email Token Again
```http
POST /auth/send-email-token-again
Content-type: application/json
{
  "email": "test@example.com"
}
```
**Response** 200 OK
```json
{
  "message": "Confirmation send again"
}
```
**Algorithm:**
1. Find user by email
2. Check if user haven't already confirmed this email
3. Generate new email confirmation token
4. Send confirmation email with token
5. Return success message
---
#### Login
```http
POST /api/auth/login
Content-Type: application/json
{
  "login": "test_user",
  "password": "testPassword123"
}
OR
{
  "email": "test@example.com",
  "password": "testPassword123"
}
```
**Response:** 200 OK
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "login": "test_user",
    "full_name": "Test User",
    "role": "user"
  }
}
```
**Algorithm:**
1. Find user by login or email
2. Compare password with hashed password
3. Check if email is confirmed
4. Create session with user data
5. Return user information
---
#### Password Reset Request
```http
POST /api/auth/reset-password-request
Content-Type: application/json
{
  "email": "john@example.com"
}
```
Then go to the link given via email and take token from there:
```
GET /auth/reset-password?token={password_reset_token}
```
**Response** 200 OK
```json
{
  "message": "Put this request: /auth/reset-password and put this token in this request"
  "token": "abc123"
}
```
Then make this request:
```
POST /api/auth/reset-password
Content-Type: application/json
{
  "token": "abc123",
  "password": "newtestPassword123",
  "confirm-password": "newtestPassword123"
}
```
**Response:** 200 OK
```json
{
  "message": "Password has been reset successfully."
}
```
**Algorithm:**
1. Find user by email
2. Generate reset token
3. Set token expiration (10 minutes)
4. Save token to database
5. Send reset link via email
6. Return success message
**Alogithm of next POST**
1. Check if token is not expired
2. Find user by reset token
3. Hash password with bcrypt
4. Save new password to the database
5. Return success message
---
#### Logout
```http
POST /api/auth/logout
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Logout successful."
}
```
**Algorithm:**
1. Check if user is logged in
2. Destroy session
3. Return success message
---
### User Module
#### Get All Users
```http
GET /api/users
```
**Response:** 200 OK
```json
{
  "users": [
    {
      "id": 1,
      "login": "test_user",
      "full_name": "Test User",
      "email": "test@example.com",
      "profile_picture": "uploads/default_profile.png",
      "rating": 25,
      "role": "user",
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```
**Algorithm:**
1. Return array of users
---
#### Get Specific User
```http
GET /api/users/:user_id
```
**Response:** 200 OK
```json
{
  "user": {
    "id": 1,
    "login": "test_user",
    "full_name": "Test User",
    "email": "test@example.com",
    "profile_picture": "default_avatar.png",
    "rating": 25,
    "role": "user",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```
**Algorithm:**
1. Check if user with given id exists
2. Return user
---
#### Create User (Admin only)
```http
POST /api/users
Content-Type: application/json
Authorization: Session cookie required
{
  "login": "newadmin",
  "full_name": "New Admin",
  "password": "Admin123",
  "email": "newadmin@usof.com",
  "role": "admin"
}
```
**Response:** 200 OK
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "login": "newadmin",
    "full_name": "New Admin",
    "email": "newadmin@usof.com",
    "email_confirmed": true,
    "profile_picture": "uploads/default_profile.png",
    "rating": 0,
    "role": "admin",
    "created_at": "2025-10-07T10:30:00.000Z"
  }
}
```
**Algorithm:**
1. Check if user logged in and has admin privileges
2. Validate input data
3. Check if login/email already exists
4. Hash password with bcrypt
5. Return success message
---
#### Upload Avatar
```http
PATCH /api/users/avatar
Content-Type: multipart/form-data
Authorization: Session cookie required
avatar: [file]
```
**Response:** 200 OK
```json
{
  "message": "Avatar updated successfully",
  "path": "uploads/avatar-123321.jpg"
}
```
**Algorithm:**
1. Check if user is logged in
2. Validate file
3. Save file to uploads directory
4. Update user's profile_picture path in database
5. Return success with file path
---
#### Get User Avatar
```http
GET /api/profile/avatar/:id
```
**Response:** 200 OK
```json
{
  "imagePath": "uploads/avatar-123321.jpg"
}
```
**Algorithm:**
1. Check if user with given id exists
2. Return success with file path
---
#### Update user
```http
PATCH /api/users/:user_id
Content-Type: application/json
Authorization: Session cookie required
{
  "full_name": "Updated Name",
  "email": "updated@example.com"
}
```
**Response:** 200 OK
```json
{
  "message": "User updated successfully. Please confirm your new email address if you changed it."
  "user": {
    "id": 3,
    "login": "test_user",
    "full_name": "Updated Name",
    "email": "updated@example.com",
    "email_confirmed": false,
    "profile_picture": "uploads/avatar-123124.png",
    "rating": 3,
    "role": "user",
    "created_at": "2025-10-07T10:30:00.000Z"
  }
}
```
**Algorithm:**
1. Check if logged in, and if given user exists
2. Check if they owner of account we want to update or if they have admin privileges
3. If `email` is being changed generate email confirmation token and add to updated fields
4. If `email_confirmation_token` in the updated fields: Send email confirmation link with token
5. Save updated fields in the database
6. Return success with updated user
---
#### Update User Role (Admin only)
```http
PATCH /api/users/:user_id/role
Content-Type: application/json
Authorization: Session cookie required
{
  "role": "admin"
}
```
**Response:** 200 OK
```json
{
  "message": "User role updated successfully."
}
```
**Algorithm**
1. Check if user logged in
2. Validate data
3. Check if user with given id exists
4. Update user role
5. Return success message
---
#### Delete User (Admin only)
```http
DELETE /api/users/:user_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "User deleted successfully."
}
```
**Algorithm:**
1. Check if user logged in and has admin privileges
2. Check if user with given id exists
3. Delete user from database
4. Return success message
---
### Category Module
#### Get all categories
```htttp
GET /api/categories
```
**Response:** 200 OK
```json
{
  "categories": [
    {
      "id": 10,
      "title": "API Development"
    },
    {
      "id": 7,
      "title": "CSS"
    }
  ]
}
```
**Algorithm:**
1. Return array of categories
---
#### Get specific category
```http
GET /api/categories/:category_id
```
**Response:** 200 OK
```json
{
  "category": {
    "id": 1,
    "title": "JavaScript"
  }
}
```
**Algorithm:**
1. Check if category with given id exists
2. Return category
---
#### Get category posts
```http
GET /api/categories/:category_id/posts
```
**Response:** 200 OK
```json
{
  "category": {
  "id": 5,
    "title": "React"
  },
  "posts": [
    {
      "id": 2,
      "author_id": 3,
      "title": "Best practices for React hooks?",
      "content": "I am new to React hooks and wondering what are the best practices when using useState and useEffect? Should I always use useCallback? Any tips would be appreciated!",
      "published_at": "2025-01-14T09:30:00.000Z",
      "updated_at": "2025-10-06T14:31:14.000Z",
      "status": "active",
      "is_locked": 0,
      "likes_count": 6,
      "comments_count": 5,
      "author_login": "jane_smith",
      "author_name": "Jane Smith",
      "categories": [
        "React"
      ],
      "images": []
    }
  ]
}
```
**Algorithm:**
1. Check if category with given id exists
2. Return category and posts that related to it
---
#### Create category (Admin only)
```http
POST /api/categories
Content-Type: application/json
Authorization: Session cookie required
{
  "title": "TypeScript"
}
```
**Response** 201 OK
```json
{
  "message": "Category created successfully",
  "category": {
    "id": 11,
    "title": "TypeScript"
  }
}
```
**Algorithm**
1. Check if user logged in and has admin privileges
2. Check if category with this title don't exists yet
3. Create new category
4. Return success message and created category
---
#### Update category (Admin only)
```http
PATCH /api/categories/:category_id
Content-Type: application/json
Authorization: Session cookie required
{
  "title": "JavaScript Advanced"
}
```
**Response** 200 OK
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": 11,
    "title": "JavaScript Advanced"
  }
}
```
**Algorithm**
1. Check if user logged in and has admin privileges
2. Check if category with given id exists
3. Check if category with title on which we want to change doesn't exists yet
4. Update category title
5. Return success message and category
---
#### Delete category (Admin only)
```http
DELETE /api/categories/:category_id
Authorization: Session cookie required
```
**Response** 200 OK
```json
{
  "message": "Category deleted successfully"
}
```
**Algorithm**
1. Check if user logged in and has admin privileges
2. Check if category with given id exists
3. Delete category from the database
4. Return success message
---
### Post module
#### Get All Posts
```http
GET /api/posts
GET /api/posts?sort_by=date&categories=1,3&limit=10&offset=0
```
**Query Parameters:**
- `sort_by`: `likes` (default) or `date`
- `categories`: comma-separated category IDs
- `status`: `active`, `inactive` (if user is author, or automatically change on `active`), or `all` (admin only)
- `date_from`: filter from date (YYYY-MM-DD)
- `date_to`: filter to date (YYYY-MM-DD)
- `limit`: pagination limit (default: 20)
- `offset`: pagination offset (default: 0)
**Response** 200 OK
```json
{
  "posts": [
    {
      "id": 1,
      "author_id": 2,
      "title": "How to fix MySQL connection error?",
      "content": "I am getting a connection refused error...",
      "published_at": "2025-01-14T08:00:00.000Z",
      "status": "active",
      "is_locked": false,
      "likes_count": 5,
      "comments_count": 3,
      "author_login": "test_user",
      "author_name": "Test User",
      "categories": ["MySQL", "Node.js"],
      "category_ids": [3, 4],
      "images": ["uploads/postImages-123.jpg"]
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```
**Algorithm:**
1. Parse query parameters for filters
2. Check user role: guests see active only, users see active + own inactive, admins see all
3. Build SQL query with filters (categories, dates, status)
4. Apply sorting (likes or date)
5. Apply pagination
6. Return posts with pagination info
---
#### Get Specific Post
```http
GET /api/posts/:post_id
```
**Response:** 200 OK
```json
{
  "post": {
    "id": 1,
    "author_id": 2,
    "title": "How to fix MySQL connection error?",
    "content": "I am getting a connection refused error...",
    "published_at": "2025-01-14T08:00:00.000Z",
    "updated_at": "2025-01-14T08:00:00.000Z",
    "status": "active",
    "is_locked": false,
    "likes_count": 5,
    "comments_count": 3,
    "author_login": "test_user",
    "author_name": "Test User",
    "author_avatar": "uploads/avatar-123.jpg",
    "categories": ["MySQL", "Node.js"],
    "images": []
  }
}
```
**Algorithm:**
1. Check if post exists
2. Check permissions (inactive posts visible only to author and admins)
3. Return post details
---
#### Create Post
```http
POST /api/posts
Content-Type: multipart/form-data
Authorization: Session cookie required

title: "My New Question"
content: "How do I implement JWT authentication?"
categories: 1,3
postImages: [select up to 10 images]
```
**Response:** 201 Created
```json
{
  "message": "Post created successfully",
  "post": {
    "id": 15,
    "author_id": 2,
    "title": "My New Question",
    "content": "How do I implement JWT authentication?",
    "status": "active",
    "likes_count": 0,
    "comments_count": 0,
    "categories": ["JavaScript", "MySQL"],
    "images": ["uploads/postImages-456.jpg"]
  }
}
```
**Algorithm:**
1. Check if user is logged in
2. Parse categories (handle both array and comma-separated string)
3. Validate categories exist in database
4. Create post in database
5. Link categories to post
6. Save uploaded images
7. Return created post
---
#### Update Post
```http
PATCH /api/posts/:post_id
Content-Type: application/json
Authorization: Session cookie required
{
  "title": "Updated Title",
  "content": "Updated content",
  "categories": [1, 2],
  "status": "inactive"
}
```
**Response:** 200 OK
```json
{
  "message": "Post updated successfully",
  "post": { /* updated post object */ }
}
```
**Algorithm:**
1. Check if post exists
2. Verify permissions (owner or admin)
3. Validate categories if provided
4. Users can update title/content, admins can update status
5. Update post and categories
6. Return updated post
---
#### Delete Post
```http
DELETE /api/posts/:post_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Post deleted successfully"
}
```
**Algorithm:**
1. Check if post exists
2. Verify permissions (owner or admin)
3. Delete associated image files
4. Delete post (CASCADE deletes related records)
5. Return success message
---
#### Get Post Categories
```http
GET /api/posts/:post_id/categories
```
**Response:** 200 OK
```json
{
  "categories": [
    { "id": 1, "title": "JavaScript" },
    { "id": 3, "title": "MySQL" }
  ]
}
```
**Algorithm:**
1. Return array of all categories
---
#### Get Post Comments
```http
GET /api/posts/:post_id/comments
```
**Response:** 200 OK
```json
{
  "comments": [
    {
      "id": 5,
      "post_id": 1,
      "author_id": 3,
      "content": "Great question!",
      "author_login": "jane_doe",
      "published_at": "2025-01-15T12:30:00.000Z",
      "status": "active",
      "likes_count": 3,
      "replies": [
        {
          "id": 6,
          "content": "Thanks!",
          "author_login": "john_doe",
          "parent_comment_id": 5,
          "replies": []
        }
      ]
    }
  ]
}
```
**Algorithm:**
1. Check if post exists
2. Fetch all active comments for post
3. Organize into threaded structure (comments with replies)
4. Return nested comment tree
---
#### Create Comment
```http
POST /api/posts/:post_id/comments
Content-Type: application/json
Authorization: Session cookie required
{
  "content": "Great answer! Thanks for sharing."
}
// OR for reply:
{
  "content": "I agree!",
  "parent_comment_id": 5
}
```
**Response:** 201 Created
```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": 18,
    "post_id": 1,
    "author_id": 2,
    "content": "Great answer! Thanks for sharing.",
    "published_at": "2025-10-07T15:00:00.000Z",
    "author_login": "john_doe"
  }
}
```
**Algorithm:**
1. Check if post exists and is active
2. Check if post is not locked
3. If replying, verify parent comment exists
4. Create comment
5. Update post comment count
6. Send notifications to post author and followers
7. Return created comment
---
#### Get Post Likes
```http
GET /api/posts/:post_id/like
```
**Response:** 200 OK
```json
{
  "likes": [
    {
      "id": 10,
      "author_id": 3,
      "author_login": "jane_doe",
      "type": "like",
      "created_at": "2025-01-15T13:00:00.000Z"
    }
  ],
  "dislikes": [],
  "total_likes": 15,
  "total_dislikes": 2,
  "score": 13
}
```
**Algorithm:**
1. Return likes array with summary info
---
#### Add Like to Post
```http
POST /api/posts/:post_id/like
Content-Type: application/json
Authorization: Session cookie required
{
  "type": "like"
}
// OR
{
  "type": "dislike"
}
```
**Response:** 200 OK
```json
{
  "message": "Post created successfully",
  "action": "created",
  "type": "like"
}
```
**Algorithm (Toggle Behavior):**
1. Check if post exists and is active
2. Check if user already liked/disliked:
   - Same type → Remove it (toggle off)
   - Different type → Update it (like ↔ dislike)
   - No existing → Create new
3. Update post like count
4. Recalculate author's rating
5. Return action performed
---
#### Delete Post Like
```http
DELETE /api/posts/:post_id/like
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Like removed successfully"
}
```
---
### Comment Module
#### Get Specific Comment
```http
GET /api/comments/:comment_id
```
**Response:** 200 OK
```json
{
  "comment": {
    "id": 1,
    "post_id": 1,
    "author_id": 3,
    "content": "Check if MySQL service is running...",
    "published_at": "2025-01-14T08:15:00.000Z",
    "status": "active",
    "likes_count": 2,
    "author_login": "jane_smith",
    "author_name": "Jane Smith"
  }
}
```
---
#### Update Comment
```http
PATCH /api/comments/:comment_id
Content-Type: application/json
Authorization: Session cookie required
// As user (owner):
{
  "content": "Updated comment text"
}
// As admin:
{
  "status": "inactive"
}
```
**Response:** 200 OK
```json
{
  "message": "Comment updated successfully",
  "comment": { /* updated comment */ }
}
```
**Algorithm:**
1. Check if comment exists
2. Users can update their own content
3. Admins can change status (but not content)
4. Update comment
5. If status changed, update post comment count
6. Return updated comment
---
#### Delete Comment
```http
DELETE /api/comments/:comment_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Comment deleted successfully"
}
```
**Algorithm:**
1. Check if comment exists
2. Verify permissions (owner or admin)
3. Delete comment
4. Update post comment count
5. Return success message
---
#### Get Comment Likes
```http
GET /api/comments/:comment_id/like
```

**Response:** 200 OK (same format as post likes)

---
#### Add Like to Comment
```http
POST /api/comments/:comment_id/like
Content-Type: application/json
Authorization: Session cookie required
{
  "type": "like"
}
```
**Response:** 200 OK
```json
{
  "message": "Comment created successfully",
  "action": "created",
  "type": "like"
}
```
---
#### Delete Comment Like
```http
DELETE /api/comments/:comment_id/like
Authorization: Session cookie required
```
---
### Notification Module
#### Get User Notifications
```http
GET /api/notifications
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "notifications": [
    {
      "id": 23,
      "user_id": 2,
      "author_id": 3,
      "author_login": "jane_doe",
      "message": "New comment on your post: 'How to fix MySQL...'",
      "target_type": "comment",
      "target_id": 5,
      "is_read": false,
      "created_at": "2025-01-15T14:00:00.000Z"
    }
  ]
}
```
**Algorithm:**
1. Fetch all notifications for logged-in user
2. Include author info and target details
3. Return sorted by creation date (newest first)
---
#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "unread_count": 5
}
```
---
#### Mark Notification as Read
```http
PATCH /api/notifications/:notification_id/read
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Notification marked as read"
}
```
---
#### Mark All as Read
```http
PATCH /api/notifications/mark-all-read
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "All notifications marked as read"
}
```
---
#### Delete Notification
```http
DELETE /api/notifications/:notification_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Notification deleted successfully"
}
```
---
### Collection Module (Favorites)
#### Get Public Collections
```http
GET /api/collections
```
**Response:** 200 OK
```json
{
  "collections": [
    {
      "id": 1,
      "user_id": 2,
      "title": "My Favorite Solutions",
      "description": "Posts that helped me",
      "is_private": false,
      "owner_login": "john_doe",
      "posts_count": 5,
      "created_at": "2025-01-14T10:00:00.000Z"
    }
  ]
}
```
---
#### Get User's Collections
```http
GET /api/collections/my
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "collections": [
    {
      "id": 1,
      "user_id": 2,
      "title": "My Favorites",
      "is_private": false,
      "posts_count": 3
    }
  ]
}
```
---
#### Get Specific Collection
```http
GET /api/collections/:collection_id
```
**Response:** 200 OK
```json
{
  "collection": {
    "id": 1,
    "user_id": 2,
    "title": "My Favorite Solutions",
    "description": "Posts that helped me solve problems",
    "is_private": false,
    "owner_login": "john_doe",
    "posts_count": 5
  }
}
```
**Algorithm:**
1. Check if collection exists
2. Check access (public or owner)
3. Return collection
---
#### Create Collection
```http
POST /api/collections
Content-Type: application/json
Authorization: Session cookie required
{
  "title": "My Favorites",
  "description": "Posts I like",
  "is_private": false
}
```
**Response:** 201 Created
```json
{
  "message": "Collection created successfully",
  "collection": { /* created collection */ }
}
```
**Algorithm:**
1. Check if user already has collection with this title
2. Create collection
3. Return created collection
---
#### Update Collection
```http
PATCH /api/collections/:collection_id
Content-Type: application/json
Authorization: Session cookie required
{
  "title": "Updated Title",
  "is_private": true
}
```
**Response:** 200 OK
```json
{
  "message": "Collection updated successfully",
  "collection": { /* updated collection */ }
}
```
---
#### Delete Collection
```http
DELETE /api/collections/:collection_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Collection deleted successfully"
}
```
---
#### Get Collection Posts
```http
GET /api/collections/:collection_id/posts
```
**Response:** 200 OK
```json
{
  "collection": { /* collection info */ },
  "posts": [ /* array of posts */ ]
}
```
---
#### Add Post to Collection
```http
POST /api/collections/:collection_id/posts/:post_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Post added to collection successfully"
}
```
**Algorithm:**
1. Check collection ownership
2. Check if post exists and is active
3. Check if post not already in collection
4. Add post to collection
5. Return success message
---
#### Remove Post from Collection
```http
DELETE /api/collections/:collection_id/posts/:post_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Post removed from collection successfully"
}
```
---
### Follow Module
#### Follow Post
```http
POST /api/posts/:post_id/follow
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Post followed successfully"
}
```
**Algorithm:**
1. Check if post exists and is active
2. Check user is not post author (can't follow own posts)
3. Check not already following
4. Create follow relationship
5. Return success message
---
#### Unfollow Post
```http
DELETE /api/posts/:post_id/follow
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Post unfollowed successfully"
}
```
---
#### Get Followed Posts
```http
GET /api/follow/posts
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "followed_posts": [
    {
      "id": 15,
      "title": "How to fix MySQL connection?",
      "author_login": "jane_doe",
      "likes_count": 25,
      "comments_count": 8,
      "categories": ["MySQL", "Database"]
    }
  ]
}
```
---
#### Get Post Followers
```http
GET /api/posts/:post_id/followers
```
**Response:** 200 OK
```json
{
  "post": {
    "id": 1,
    "title": "How to fix MySQL connection error?"
  },
  "followers": [
    {
      "id": 2,
      "login": "john_doe",
      "full_name": "John Doe",
      "profile_picture": "uploads/avatar-123.jpg"
    }
  ],
  "followers_count": 5
}
```
---
#### Check Follow Status
```http
GET /api/posts/:post_id/follow-status
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "is_following": true
}
```
---
### Report Module
#### Create Report
```http
POST /api/reports
Content-Type: application/json
Authorization: Session cookie required
// Report a post:
{
  "post_id": 1,
  "reason": "This post contains spam"
}
// OR report a comment:
{
  "comment_id": 2,
  "reason": "Offensive language"
}
```
**Response:** 201 Created
```json
{
  "message": "Report submitted successfully",
  "report_id": 10
}
```
**Algorithm:**
1. Check user hasn't already reported this content
2. Verify content exists
3. Check user is not reporting own content
4. Create report with status 'pending'
5. Return report ID
---
#### Get All Reports (Admin only)
```http
GET /api/reports
GET /api/reports?status=pending
Authorization: Admin session required
```
**Response:** 200 OK
```json
{
  "reports": [
    {
      "id": 1,
      "reporter_id": 3,
      "reporter_login": "jane_doe",
      "post_id": 8,
      "post_title": "Test Post",
      "reason": "Spam content",
      "status": "pending",
      "target_type": "post",
      "created_at": "2025-10-05T14:30:00.000Z"
    }
  ]
}
```
---
#### Get User's Reports
```http
GET /api/reports/my
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "reports": [ /* user's reports */ ]
}
```
---
#### Get Report Statistics (Admin)
```http
GET /api/reports/stats
Authorization: Admin session required
```
**Response:** 200 OK
```json
{
  "stats": {
    "total_reports": 15,
    "pending_reports": 5,
    "reviewed_reports": 3,
    "resolved_reports": 7
  }
}
```
---
#### Get Specific Report (Admin)
```http
GET /api/reports/:report_id
Authorization: Admin session required
```
**Response:** 200 OK
```json
{
  "report": {
    "id": 1,
    "reporter_login": "jane_doe",
    "post_id": 8,
    "post_title": "Test Post",
    "post_content": "...",
    "reason": "Spam content",
    "status": "pending",
    "target_type": "post"
  }
}
```
---
#### Process Report (Admin)
```http
PATCH /api/reports/:report_id/process
Content-Type: application/json
Authorization: Admin session required
{
  "action": "deleted",
  "message": "Content violates community guidelines"
}
```
**Actions:** `"ignored"`, `"deleted"`, `"warned"`
**Response:** 200 OK
```json
{
  "message": "Report processed successfully",
  "action": "deleted",
  "status": "resolved"
}
```
**Algorithm:**
1. Check report is pending
2. Based on action:
   - **ignored**: Mark as resolved
   - **deleted**: Set content status to inactive
   - **warned**: Issue warning (content stays active)
3. Update report status
4. Notify reporter about resolution
5. If deleted/warned - notify content author
6. Return success message
---
#### Delete Report
```http
DELETE /api/reports/:report_id
Authorization: Session cookie required
```
**Response:** 200 OK
```json
{
  "message": "Report deleted successfully"
}
```
**Algorithm:**
1. Check permissions (admin or reporter)
2. Delete report
3. Return success message
---
## Error Responses
All endpoints may return these error responses:
**400 Bad Request**
```json
{
  "error": "Validation error message"
}
```
**401 Unauthorized**
```json
{
  "error": "Log in required."
}
```
**403 Forbidden**
```json
{
  "error": "Access denied."
}
```
**404 Not Found**
```json
{
  "error": "Resource not found"
}
```
**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```
---
## Key Algorithms & Workflows
### User Rating Calculation
**Trigger:** When like/dislike is added or removed
**Flow:**
```
Like/Dislike Action
    ↓
Update target's likes_count
    ↓
Recalculate author's rating
    ↓
Sum all likes - all dislikes
on user's posts & comments
```
---
### Notification System Workflow

**1. Comment Notification:**
```
User creates comment
    ↓
Insert comment
    ↓
Update post comment count
    ↓
Notify post author ────┐
    ↓                  ↓
Query post followers   Notification created
    ↓                  in database
For each follower      ↓
(except commenter)     User sees notification
    ↓                  when they log in
Create notification
```
**2. Report Resolution Notification:**
```
Admin processes report
    ↓
Update content status (if needed)
    ↓
Update report status
    ↓
├─→ Notify reporter
└─→ Notify content author (if applicable)
```
---
### Session Management
- Sessions stored in memory
- Session duration: 10 minutes
- Session contains: user ID, login, full_name, role
---
### Permission Matrix
| Action | User | Admin | Guest |
|--------|------|-------|-------|
| View active posts | ✅ | ✅ | ✅ |
| View inactive posts | Own only | ✅ | ❌ |
| Create post | ✅ | ✅ | ❌ |
| Edit post | Own only | ❌ | ❌ |
| Delete post | Own only | ✅ | ❌ |
| Change post status | ❌ | ✅ | ❌ |
| Create comment | ✅ | ✅ | ❌ |
| Edit comment content | Own only | ❌ | ❌ |
| Change comment status | ❌ | ✅ | ❌ |
| Like/Dislike | ✅ | ✅ | ❌ |
| Create category | ❌ | ✅ | ❌ |
| Process reports | ❌ | ✅ | ❌ |
---
## Database Schema Overview
```
users
  ├── posts (1:many)
  │   ├── post_categories (many:many with categories)
  │   ├── post_images (1:many)
  │   ├── comments (1:many)
  │   ├── likes (1:many)
  │   ├── follow_posts (many:many with users)
  │   └── reports (1:many)
  ├── comments (1:many)
  │   └── likes (1:many)
  ├── collections (1:many)
  │   └── collection_posts (many:many with posts)
  ├── notifications (1:many)
  └── reports (1:many)
```
---
## Key Features
**Complete Authentication System**
- Email confirmation required
- Password reset via email tokens
- Secure session management

**Post Management**
- Create posts with multiple categories and images
- Sorting (likes/date) and filtering (categories/date range/status)
- Users see active posts + own inactive posts
- Admins see everything

**Comment System**
- Threaded comments (replies to replies)
- Active/inactive status management
- Automatic notifications

**Like/Dislike System**
- Toggle behavior (click again to remove)
- Automatic user rating calculation
- Works on both posts and comments

**Notification System**
- New comments on followed posts
- Comments on your posts
- Report resolutions

**Collections (Favorites)**
- Organize favorite posts
- Public/private collections
- Easy post management

**Follow System**
- Follow interesting discussions
- Get notified of updates
- Track engagement

**Report & Moderation**
- Report inappropriate content
- Admin processing tools
- Automated notifications
---
## Used Practices
- **MVC Pattern**: Clear separation of concerns
- **SOLID Principles**: Maintainable, extensible code
- **Role-Based Access Control**: User/Admin permissions
- **Password Security**: bcrypt hashing with salt
- **Email Verification**: Nodemailer integration
- **File Upload**: Multer with validation
- **Session Management**: Express-session
- **Error Handling**: Comprehensive error responses
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Parameterized queries
---
## Progress record (day by day)
1. Start of the project. Created MySql scheme.
1. Started work on registration with email confirmation.
2. Finished registration with email confirmation. Added posibility to log in and logout
4. Added posibility to reset password, delete user, send token to the email again and update user role.
6. Made Post and Category Models and started work on controller and router for them.
9. Fixed error with wrong saving date in database that caused password to not work.
9. Update on User control and Main rounter.
10. Updated router. Finished model and controller for categories
13. Finished Act Basic.
15. Almost finished everything.
17. Fixed some responces and finished debagging.
18. Added seed data.
19. Finished writing README.
---
## Author

Diana Malashta
Innovation Campus NTU "KhPI"
FullStack Track Challenge
