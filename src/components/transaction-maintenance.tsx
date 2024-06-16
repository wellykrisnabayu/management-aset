import { FC, useContext, useEffect, useState } from "react";
import { TransactionModel } from "../models/transactionModel";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormHelperText, MenuItem, Stack, TextField } from "@mui/material";
import * as Yup from 'yup';
import { useFormik } from "formik";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from "dayjs";
import { confirmMessage } from "../utils/confirmMessage";
import { showMessage } from "../utils/showMessage";
import { child, get, onValue, ref, update } from "firebase/database";
import { COLLHISTORY, COLLMASTERDATA, COLLTRANSACTION, COLLTRANSACTIONKEY } from "../utils/GlobalVariable";
import { DBProvider } from "../App";
import { LISTSTATUS } from "../variables/listStatus";
import { MasterDataModel } from "../models/EnrolledModel";
import moment from "moment";

export type MIANTENANCETRANSACTIONACTION = 'new' | 'update' | ''

interface TransactionMaintenanceProps {
    handleClose: () => void
    open: boolean
    data?: TransactionModel,
    action: MIANTENANCETRANSACTIONACTION
}


const initialValues = {
    id: '',
    itemName: '',
    name: '',
    nik: '',
    phoneNumber: '',
    orderDate: '',
    returnDate: '',
    status: '',
    address: '',
    submit: null,
    pricePerMonth: '',
    pricePerWeek: ''
}

const validationSchema = Yup.object({

});

const TransactionMaintenance: FC<TransactionMaintenanceProps> = ({ handleClose, open, data, action }) => {
    const { db } = useContext(DBProvider)
    const form = useFormik({
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            handleSubmit({ ...values, status: 'READY' })
        }
    });

    const [transctionKey, setTransactionKey] = useState<string>('')
    const [statusField, setStatusField] = useState<string>('')

    const [orderDateValue, setOrderDateValue] = useState<Dayjs | null>(
        dayjs(),
    );

    const [returnDateValue, setReturnDateValue] = useState<Dayjs | null>(
        dayjs(),
    );
    async function handleSubmit(data: TransactionModel) {
        const confirm = await confirmMessage('Are you sure to save data?')
        if (confirm) {
            if (action === 'new') {
                HanddleAddTransaction(data)
            } else if (action === 'update') {
                HandleUpdateData(data)
            }
        }
    }

    async function HandleUpdateData(data: TransactionModel) {
        const request: { [key: string]: any } = {}
        const allTransaction: TransactionModel[] = await get(child(ref(db.database), COLLHISTORY)).then(async (item) => {
            return item.val() || []
        })
        let status = ''
        if (statusField === 'PROCESS') {
            status = 'PROCESS'
        } else if (statusField === 'CANCEL' || statusField === 'DONE') {
            status = 'READY'
        }
        request[`${COLLTRANSACTION}/${data.id}`] = { ...data, status: status, orderDate: orderDateValue?.format('DD/MM/YYYY'), returnDate: returnDateValue?.format('DD/MM/YYYY') }
        request[COLLHISTORY] = [...allTransaction, {
            id: data.id,
            itemName: data.itemName,
            name: data.name,
            nik: data.nik,
            phoneNumber: data.phoneNumber,
            orderDate: orderDateValue?.format('DD/MM/YYYY'),
            returnDate: returnDateValue?.format('DD/MM/YYYY'),
            status: statusField,
            address: data.address,
            pricePerMonth: data.pricePerMonth,
            pricePerWeek: data.pricePerWeek,
        }]
        await update(ref(db.database), { ...request }).then(async () => {
            await showMessage('success', 'Success!', 'Success update transaction!')
            handleClose()
        }).catch(async (err) => {
            const message = (err as Error)?.message || 'Oppss, something when wrong!'
            await showMessage('error', 'Failed!', message)
        })

    }
    async function HanddleAddTransaction(data: TransactionModel) {
        const request: { [key: string]: any } = {}
        const countBorrow = await get(child(ref(db.database), `${COLLMASTERDATA}/${transctionKey}/borrowedCount`)).then(async (item) => {
            return Number(item.val() || '0')
        })
        const allTransaction: TransactionModel[] = await get(child(ref(db.database), COLLHISTORY)).then(async (item) => {
            return item.val() || []
        })
        request[`${COLLMASTERDATA}/${transctionKey}/borrowedCount`] = countBorrow + 1
        request[`${COLLTRANSACTION}/${transctionKey}`] = { ...data, status: 'PROCESS', orderDate: orderDateValue?.format('DD/MM/YYYY'), returnDate: returnDateValue?.format('DD/MM/YYYY') }
        request[COLLHISTORY] = [...allTransaction, {
            id: data.id,
            itemName: data.itemName,
            name: data.name,
            nik: data.nik,
            phoneNumber: data.phoneNumber,
            orderDate: orderDateValue?.format('DD/MM/YYYY'),
            returnDate: returnDateValue?.format('DD/MM/YYYY'),
            status: 'PROCESS',
            address: data.address,
            pricePerMonth: data.pricePerMonth,
            pricePerWeek: data.pricePerWeek,
        }]
        request[COLLTRANSACTIONKEY] = ''
        await update(ref(db.database), { ...request }).then(async () => {
            await showMessage('success', 'Success!', 'Success create transaction!')
            handleClose()
        }).catch(async (err) => {
            const message = (err as Error)?.message || 'Oppss, something when wrong!'
            await showMessage('error', 'Failed!', message)
        })
    }

    const handleChangeOrderDate = (newValue: Dayjs | null) => {
        setOrderDateValue(newValue)
    };

    const handleChangeReturnDate = (newValue: Dayjs | null) => {
        setReturnDateValue(newValue)
    };

    async function fetchTransactionKey() {
        const dbRef = ref(db.database, COLLTRANSACTIONKEY)
        onValue(dbRef, (snapshot) => {
            setTransactionKey(String(snapshot.val() || ''))
            form.setFieldValue('id', String(snapshot.val() || ''))
        }, () => {
            setTransactionKey('')
        })
    }

    async function fetchDetail() {
        form.resetForm()
        const dataItem: MasterDataModel = await get(child(ref(db.database), `${COLLMASTERDATA}/${transctionKey}`)).then(async (item) => {
            return item.val()
        })
        if (!dataItem) {
            await showMessage('warning', 'RFID Not Found!', 'make sure your rfid already enrolled!')
            handleClose()
            return
        }
        const dataTransaction: TransactionModel = await get(child(ref(db.database), `${COLLTRANSACTION}/${transctionKey}`)).then(async (item) => {
            return item.val()
        })
        if (!dataTransaction) {
            if (!dataItem) {
                await showMessage('warning', 'RFID Not Found!', 'make sure your rfid already enrolled!')
                handleClose()
                return
            }
        } else if (dataTransaction.status !== 'READY') {
            form.setFieldValue('id', transctionKey)
            form.setFieldValue('itemName', String(dataItem.alatKesehatan || ''))
            await showMessage('warning', 'Item in use!', 'Cannt create transaction with this item!')
            handleClose()
            return
        }
        form.setFieldValue('id', transctionKey)
        form.setFieldValue('itemName', String(dataItem.alatKesehatan || ''))
        form.setFieldValue('name', '')
        form.setFieldValue('nik', '')
        form.setFieldValue('phoneNumber', '')
        form.setFieldValue('address', '')
        form.setFieldValue('status', 'PROCESS')
        form.setFieldValue('pricePerMonth', dataItem.pricePerMonth)
        form.setFieldValue('pricePerWeek', dataItem.pricePerWeek)
    }

    async function closedHandle(event, reason) {
        console.log(event)
        if (reason && reason === "backdropClick") return;
        handleClose()
    }


    useEffect(() => {
        if (open && action === 'new') {
            fetchTransactionKey()
        } else if (open && action === 'update' && data) {
            form.setFieldValue('id', data?.id)
            form.setFieldValue('itemName', data?.itemName)
            form.setFieldValue('name', data?.name)
            form.setFieldValue('nik', data?.nik)
            form.setFieldValue('phoneNumber', data?.phoneNumber)
            form.setFieldValue('address', data?.address)
            form.setFieldValue('status', data?.status)
            form.setFieldValue('pricePerMonth', data?.pricePerMonth)
            form.setFieldValue('pricePerWeek', data?.pricePerWeek)
            setOrderDateValue(dayjs(moment(data.orderDate, 'DD/MM/YYYY').format()))
            setReturnDateValue(dayjs(moment(data.returnDate, 'DD/MM/YYYY').format()))
            setStatusField(data.status)
        }
    }, [open, action, data])

    useEffect(() => {
        if (open && transctionKey !== '' && action === 'new') {
            fetchDetail()
        }
    }, [transctionKey])

    useEffect(() => {
        form.setFieldValue('status', statusField)
    }, [statusField])


    async function onCancelClick() {
        handleClose()
    }

    return (
        <Dialog
            open={open}
            onClose={closedHandle}
            fullWidth
            maxWidth="sm"
            hideBackdrop={true}
        >
            <form onSubmit={form.handleSubmit}>
                <DialogTitle>{action === 'new' ? 'Add' : 'Update'} Data Transaction</DialogTitle>
                <Divider />
                <DialogContent>
                    <Box>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label="RF ID"
                                name="rfId"
                                disabled
                                error={Boolean(form.touched.id && form.errors.id)}
                                value={form.values.id}
                                helperText={form.touched.id && form.errors.id}
                                onBlur={form.handleBlur}
                                onChange={form.handleChange}
                            />
                            <TextField
                                fullWidth
                                label="Item Name"
                                name="itemName"
                                disabled
                                error={Boolean(form.touched.itemName && form.errors.itemName)}
                                value={form.values.itemName}
                                helperText={form.touched.itemName && form.errors.itemName}
                                onBlur={form.handleBlur}
                                onChange={form.handleChange}
                            />
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                error={Boolean(form.touched.name && form.errors.name)}
                                value={form.values.name}
                                helperText={form.touched.name && form.errors.name}
                                onBlur={form.handleBlur}
                                onChange={form.handleChange}
                            />
                            <TextField
                                fullWidth
                                label="NIK"
                                name="nik"
                                error={Boolean(form.touched.nik && form.errors.nik)}
                                value={form.values.nik}
                                helperText={form.touched.nik && form.errors.nik}
                                onBlur={form.handleBlur}
                                onChange={form.handleChange}

                            />
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DesktopDatePicker
                                    label="Order Date"
                                    inputFormat="MM/DD/YYYY"
                                    value={orderDateValue}
                                    onChange={handleChangeOrderDate}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                                <DesktopDatePicker
                                    label="Return Date"
                                    inputFormat="MM/DD/YYYY"
                                    value={returnDateValue}
                                    onChange={handleChangeReturnDate}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                error={Boolean(form.touched.phoneNumber && form.errors.phoneNumber)}
                                value={form.values.phoneNumber}
                                helperText={form.touched.phoneNumber && form.errors.phoneNumber}
                                onBlur={form.handleBlur}
                                onChange={form.handleChange}

                            />

                            <TextField
                                fullWidth
                                multiline={true}
                                label="Address"
                                name="address"
                                error={Boolean(form.touched.address && form.errors.address)}
                                value={form.values.address}
                                helperText={form.touched.address && form.errors.address}
                                onBlur={form.handleBlur}
                                onChange={form.handleChange}
                                minRows={5}
                            />

                            <TextField
                                error={Boolean(form.touched.status && form.errors.status)}
                                fullWidth
                                helperText={form.touched.status && form.errors.status}
                                label="Status"
                                name="status"
                                onBlur={form.handleBlur}
                                onChange={(e) => {
                                    setStatusField(e.target.value)
                                }}
                                select
                                value={form.values.status}
                                disabled={action === 'new'}
                            >
                                {LISTSTATUS.filter(p => p.value !== 'READY').map((item) => (
                                    <MenuItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </TextField>


                        </Stack>
                        {form.errors.submit && (
                            <FormHelperText
                                error
                                sx={{ mt: 3 }}
                            >
                                {form.errors.submit}
                            </FormHelperText>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancelClick}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default TransactionMaintenance