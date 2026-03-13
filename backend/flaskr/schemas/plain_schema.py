from marshmallow import Schema, fields, validate


class PlainUserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class PlainSignInSchema(Schema):
    email = fields.Str(required=True)
    password = fields.Str(required=True)


class PlainTagSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)


class PlainTaskSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    content = fields.Str(required=True)
    status = fields.Str(
        validate=validate.OneOf(["PENDING", "IN_PROGRESS", "COMPLETED"]), required=True
    )
    created_at = fields.DateTime(dump_only=True, data_key="createdAt")
    deadline = fields.DateTime(allow_none=True, data_key="deadline")
    priority = fields.Str(
        validate=validate.OneOf(["LOW", "MEDIUM", "HIGH"]), required=True
    )


class PlainNotificationSchema(Schema):
    id = fields.Int(dump_only=True)
    task_id = fields.Int(dump_only=True, data_key="taskId")
    task_title = fields.Str(dump_only=True, allow_none=True, data_key="taskTitle")
    type = fields.Str(
        dump_only=True,
        validate=validate.OneOf(["TASK_DUE_SOON", "TASK_OVERDUE"]),
    )
    message = fields.Str(dump_only=True)
    is_read = fields.Bool(dump_only=True, data_key="isRead")
    created_at = fields.DateTime(dump_only=True, data_key="createdAt")


class PlainNotificationListSchema(Schema):
    items = fields.List(fields.Nested(PlainNotificationSchema), required=True)
    unread_count = fields.Int(required=True, data_key="unreadCount")
