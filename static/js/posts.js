async function submitPost() {
    const content = document.getElementById('postContent').value;
    if (!content.trim()) return;

    try {
        const response = await fetch('/api/add_post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert('Failed to add post');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add post');
    }
}

async function submitComment(postId, button) {
    const commentInput = button.parentElement.querySelector('.comment-input');
    const content = commentInput.value;
    if (!content.trim()) return;

    try {
        const response = await fetch('/api/add_comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                post_id: postId,
                content: content
            })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert('Failed to add comment');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add comment');
    }
}

async function likePost(postId, button) {
    try {
        const response = await fetch('/api/like_post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                post_id: postId
            })
        });

        if (response.ok) {
            const data = await response.json();
            const likeCount = button.querySelector('.like-count');
            likeCount.textContent = data.likes;
            
            const heart = button.querySelector('i');
            heart.classList.remove('far');
            heart.classList.add('fas');
            setTimeout(() => {
                heart.classList.remove('fas');
                heart.classList.add('far');
            }, 200);
        }
    } catch (error) {
        console.error('Error:', error);
    }
} 