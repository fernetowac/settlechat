﻿using System;
using System.Collections.Generic;

namespace SettleChat.Models
{
    public class ConversationModel
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public User Me { get; set; }
        public List<User> OtherUsers { get; set; }

        public class User
        {
            public Guid Id { get; set; }
            public string UserName { get; set; }
            public string Email { get; set; }
        }
    }
}