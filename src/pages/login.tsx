import { Avatar, Box, Button, FormHelperText, TextField, Typography } from "@mui/material";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useFormik } from "formik";
import * as Yup from 'yup';
import { FBService } from "../services/FBService";
import { COLLUSER } from "../utils/GlobalVariable";
import { showMessage } from "../utils/showMessage";
import { UserModel } from "../models/userModel";
import { useNavigate } from "react-router-dom";
const db = new FBService()

const initialValues = {
    username: '',
    password: '',
    submit: null
}

const validationSchema = Yup.object({
    username: Yup
        .string()
        .max(255)
        .required('Username is required'),
    password: Yup
        .string()
        .max(255)
        .required('Password is required'),
});

export default function LogInPage() {
    const navigate = useNavigate();
    const form = useFormik({
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            handleSubmit(values.username, values.password)
        }
    });

    async function handleSubmit(username: string, password: string) {
        db.GetData<UserModel>(`${COLLUSER}/${username}`).then((res) => {
            if (res) {
                if (password !== res.password) {
                    showMessage('error', 'Error!', 'username and password dosnt match')
                } else {
                    localStorage.setItem('can_access', '1')
                    localStorage.setItem('access_role', res.role)
                    localStorage.setItem('username', username)
                    return navigate("/");
                }
            } else {
                showMessage('error', 'Error!', 'username and password dosnt match')
            }
        }).catch((err) => {
            const message = (err as Error)?.message || 'something when wrong'
            showMessage('error', 'Error!', message)
        })
    }

    return (
        <form onSubmit={form.handleSubmit}>
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <Box>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        error={Boolean(form.touched.username && form.errors.username)}
                        value={form.values.username}
                        helperText={form.touched.username && form.errors.username}
                        onBlur={form.handleBlur}
                        onChange={form.handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        error={Boolean(form.touched.password && form.errors.password)}
                        value={form.values.password}
                        helperText={form.touched.password && form.errors.password}
                        onBlur={form.handleBlur}
                        onChange={form.handleChange}
                    />

                    {form.errors.submit && (
                        <FormHelperText
                            error
                            sx={{ mt: 3 }}
                        >
                            {form.errors.submit}
                        </FormHelperText>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign In
                    </Button>
                </Box>
            </Box>
        </form>
    );
}