import { readFile } from 'fs/promises';
import axios from 'axios';

const baseUrl = 'http://localhost:3000';

// Read dummy json data
const {
    users,
    posts,
    comments,
    headerImages,
} = JSON.parse(
  await readFile(
    new URL('./data.json', import.meta.url)
  )
);

// Create Users, Log them in and store their tokens in memory
const userTokens = [];
for(let i = 0; i < users.length; i++) {
    console.log(`Creating user #${i + 1} out of ${users.length}.`);
    const user = users[i];

    try {
        try {
            await axios.post(`${baseUrl}/users`, user);
        } catch (e) {
            console.warn(`The user ${user?.userId} already exists. Trying to login...`);
        }
        const tokenResponse = (await axios.get(`${baseUrl}/users/${user?.userId}/${user?.password}`)).data;
        userTokens.push(tokenResponse?.token);
    } catch(e) {
        console.error('An error ocurred while generating users', e);
    }
}

// Create Posts and store their IDs
const postIDs = [];
for(let i = 0; i < posts.length; i++) {
    console.log(`Creating post #${i + 1} out of ${posts.length}.`);
    const post = posts[i];
    const payload = {
        title: post?.title,
        content: post?.body,
        headerImage: headerImages[i % headerImages.length],
    };
    const selectedToken = userTokens[i % userTokens.length];

    try {
        const createdPost = (await axios.post(`${baseUrl}/posts`, payload, {
            headers: {
                'Authorization': `Bearer ${selectedToken}`
            }
        })).data;
        postIDs.push(createdPost?.postId);
    } catch(e) {
        console.error('An error ocurred while generating posts', e);
    }
}

// Create Comments
for(let i = 0; i < comments.length; i++) {
    console.log(`Creating comment #${i + 1} out of ${comments.length}.`);
    const comment = comments[i];
    const payload = {
        comment: comment?.body,
    };
    const selectedToken = userTokens[i % userTokens.length];

    try {
        await axios.post(`${baseUrl}/comments/${postIDs[i % postIDs.length]}`, payload, {
            headers: {
                'Authorization': `Bearer ${selectedToken}`
            }
        });
    } catch(e) {
        console.error('An error ocurred while generating comments', e);
    }
}