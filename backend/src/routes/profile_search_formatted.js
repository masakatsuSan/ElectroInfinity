    const viewerId = req.user?._id
    const formatted = users.map(u => ({
      _id: u._id,
      name: u.name,
      rollNumber: u.rollNumber,
      email: u.email,
      batch: u.batch,
      semester: u.semester,
      role: u.role,
      photo: u.photo,
      department: u.profile?.department || '',
      skills: u.profile?.skills || [],
      interests: u.profile?.interests || [],
      socialLinks: u.profile?.socialLinks || {},
      followers: u.followers?.length || 0,
      following: u.following?.length || 0,
      isFollowing: viewerId ? u.followers?.some(id => id.toString() === viewerId.toString()) : false,
      followsMe: viewerId ? u.following?.some(id => id.toString() === viewerId.toString()) : false,
    }))
