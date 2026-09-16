require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../src/models/User')
const FriendRequest = require('../src/models/FriendRequest')

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const users = await User.find({}).select('_id followers following')
  console.log(`Found ${users.length} users`)

  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  let mutualCount = 0
  let requestCount = 0

  for (const user of users) {
    const following = user.following || []
    for (const targetId of following) {
      const target = userMap.get(targetId.toString())
      if (!target) continue

      const isMutual = (target.following || []).some(
        id => id.toString() === user._id.toString()
      )

      if (isMutual) {
        if (!user.friends) user.friends = []
        if (!target.friends) target.friends = []
        if (!user.friends.some(id => id.toString() === targetId.toString())) {
          user.friends.push(targetId)
          mutualCount++
        }
        if (!target.friends.some(id => id.toString() === user._id.toString())) {
          target.friends.push(user._id)
        }
      } else {
        const existing = await FriendRequest.findOne({
          sender: user._id,
          recipient: targetId,
        })
        if (!existing) {
          await FriendRequest.create({
            sender: user._id,
            recipient: targetId,
            status: 'pending',
          })
          requestCount++
        }
      }
    }
  }

  await User.bulkWrite(
    users.map(u => ({
      updateOne: {
        filter: { _id: u._id },
        update: {
          $set: {
            friends: u.friends || [],
          },
          $unset: {
            followers: '',
            following: '',
          },
        },
      },
    }))
  )

  console.log(`Migrated ${mutualCount} mutual pairs to friends`)
  console.log(`Created ${requestCount} friend requests`)
  console.log('Removed followers and following fields from all users')

  await mongoose.disconnect()
  console.log('Done')
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
