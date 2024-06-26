import { Backdrop, Box, Button, Card, CircularProgress, Container, Unstable_Grid2 as Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { FC, useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { COLLMASTERDATA, FIELDALATKESEHATAN } from "../utils/GlobalVariable";
import { MasterDataDetailModel } from "../models/EnrolledModel";
import MaintenanceItem, { MAINTENANCEITEMACTION } from "../components/maintenance-item";
import { onValue, ref } from "firebase/database";
import { DBProvider } from "../App";
import MasterDataRowExpanded from "../components/masterDataRowExpanded";

export interface DataDetailForTableModel {
    name: string
    stock: number
    detail: MasterDataDetailModel[]
}
const Enrolled: FC = () => {
    const { db } = useContext(DBProvider)
    const [dataTable, setDataTable] = useState<MasterDataDetailModel[]>([])
    const [dataMapping, setDataMapping] = useState<DataDetailForTableModel[]>([])
    const [loading] = useState<boolean>(false)
    const [showDialogOpen, setShowDialogOpen] = useState<boolean>(false)
    const [selectedData, setSelectedData] = useState<MasterDataDetailModel | undefined>(undefined)
    const [action, setAction] = useState<MAINTENANCEITEMACTION>('')

    function handleCloseDialogAdd() {
        setAction('')
        setSelectedData(undefined)
        setShowDialogOpen(false)
    }

    async function fetchDataMaster() {
        const dbRef = ref(db.database, COLLMASTERDATA)
        const tmpDatas: { [key: string]: MasterDataDetailModel[] } = {}
        onValue(dbRef, (snapshot) => {
            const data = snapshot.val()
            let details: MasterDataDetailModel[] = []
            if (data) {
                const keys = Object.keys(data)
                for (const key of keys) {
                    if (!key.includes('stock')) {
                        const tmpData = { ...data[key], stock: String(data[`stock${data[key][FIELDALATKESEHATAN]}`] || '0') }
                        details = [...details, tmpData]
                    }
                }
            }
            for (const item of details) {
                if (!tmpDatas[item.alatKesehatan]) {
                    tmpDatas[item.alatKesehatan] = []
                }
                tmpDatas[item.alatKesehatan] = [...tmpDatas[item.alatKesehatan], item]
            }
            const keys = Object.keys(tmpDatas)
            let realData: DataDetailForTableModel[] = []
            for (const key of keys) {
                const x: DataDetailForTableModel = { name: key, stock: tmpDatas[key].length, detail: tmpDatas[key] }
                realData = [...realData, x]
            }
            setDataMapping(realData)
            setDataTable(details)
            console.log(dataTable)
        }, () => {
            setDataTable([])
        })
    }

    useEffect(() => {
        fetchDataMaster()
    }, [])

    return (
        <>
            <Helmet>
                <title>
                    Data Master
                </title>
            </Helmet>
            <Box
                sx={{
                    flexGrow: 1,
                    py: 8
                }}
            >
                <Container maxWidth="xl">
                    <Stack spacing={3} >
                        <div>
                            <Typography variant="h4">
                                Data Master
                            </Typography>
                        </div>
                        <div>
                            <Grid
                                container
                                spacing={3}
                            >

                                <Grid
                                    xs={12}
                                    md={12}
                                >
                                    <Card sx={{ p: 3 }}>
                                        <Stack spacing={3}>
                                            <div>
                                                <Box sx={{ mt: 3 }}>
                                                    <Button
                                                        color="primary"
                                                        size="small"
                                                        type="submit"
                                                        variant="contained"
                                                        style={{ float: 'right' }}
                                                        onClick={() => {
                                                            setAction('add')
                                                            setSelectedData(undefined)
                                                            setShowDialogOpen(true)
                                                        }}
                                                    >
                                                        Add item
                                                    </Button>
                                                </Box>
                                            </div>
                                            <div>
                                                <TableContainer component={Paper} >
                                                    <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell></TableCell>
                                                                <TableCell align="left">Alat Kesehatan</TableCell>
                                                                <TableCell align="left">Stock</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {
                                                                dataMapping.map((row, index) => (
                                                                    <MasterDataRowExpanded data={row} onUpdate={(data) => {
                                                                        setAction('update')
                                                                        setSelectedData(data)
                                                                        setShowDialogOpen(true)
                                                                    }} onDelete={
                                                                        (data) => {
                                                                            setAction('delete')
                                                                            setSelectedData(data)
                                                                            setShowDialogOpen(true)
                                                                        }
                                                                    } index={index} key={row.name} />
                                                                ))
                                                            }
                                                            {/* {dataTable.map((row, index) => (
                                                                <TableRow
                                                                    key={index}
                                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                                >
                                                                    <TableCell component="th" scope="row">
                                                                        {index + 1}
                                                                    </TableCell>
                                                                    <TableCell align="center">{row.enrolledKey}</TableCell>
                                                                    <TableCell align="center">{row.alatKesehatan}</TableCell>
                                                                    <TableCell align="center">{row.stock}</TableCell>
                                                                    <TableCell align="center">{row.pricePerWeek}</TableCell>
                                                                    <TableCell align="center">{row.pricePerMonth}</TableCell>
                                                                    {
                                                                        localStorage.getItem('access_role') !== 'operator' &&
                                                                        <TableCell align="center">
                                                                            <IconButton aria-label="update" onClick={() => {
                                                                                setAction('update')
                                                                                setSelectedData(row)
                                                                                setShowDialogOpen(true)
                                                                            }} disabled={
                                                                                localStorage.getItem('access_role') === 'operator'
                                                                            }>
                                                                                <ModeEditOutlineTwoToneIcon />
                                                                            </IconButton>
                                                                            <IconButton aria-label="delete" onClick={() => {
                                                                                setAction('delete')
                                                                                setSelectedData(row)
                                                                                setShowDialogOpen(true)
                                                                            }} disabled={
                                                                                localStorage.getItem('access_role') === 'operator'
                                                                            }>
                                                                                <DeleteTwoToneIcon />
                                                                            </IconButton>
                                                                        </TableCell>
                                                                    }

                                                                </TableRow>
                                                            ))} */}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </div>
                                        </Stack>
                                    </Card>
                                </Grid>

                            </Grid>
                            <Backdrop
                                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, position: 'absolute' }}
                                open={loading}
                            >
                                <CircularProgress color="inherit" />
                            </Backdrop>
                            <MaintenanceItem open={showDialogOpen} handleClose={handleCloseDialogAdd} action={action} selectedData={selectedData} />

                        </div>
                    </Stack>
                </Container>
            </Box>
        </>
    )
}
export default Enrolled