import { StatusModel } from "../models/statusModel";

export const LISTSTATUS: StatusModel[] = [
    {
        label: 'Ready',
        value: 'READY'
    },
    {
        label: 'Process',
        value: 'PROCESS'
    },
    {
        label: 'Cancel',
        value: 'CANCEL'
    },
    {
        label: 'Done',
        value: 'DONE'
    },
]