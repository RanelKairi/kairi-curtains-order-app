import NewOrder from './pages/NewOrder';
import OrdersList from './pages/OrdersList';
import __Layout from './Layout.jsx';


export const PAGES = {
    "NewOrder": NewOrder,
    "OrdersList": OrdersList,
}

export const pagesConfig = {
    mainPage: "NewOrder",
    Pages: PAGES,
    Layout: __Layout,
};