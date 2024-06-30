const loginFailed = (req, res) => {
    res.status(401).json({
        error: true,
        message: "Log in failure",
    });
}

module.exports = {loginFailed};