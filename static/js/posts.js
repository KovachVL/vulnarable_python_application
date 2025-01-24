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

// Добавим новую функцию для отправки комментариев
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