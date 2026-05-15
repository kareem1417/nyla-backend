import Setting from "../models/Setting.js";

export const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({ shippingFee: 50, buyXGetCheapestFree: false });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Server Error fetching settings" });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { shippingFee, buyXGetCheapestFree } = req.body;
        let settings = await Setting.findOne();

        if (settings) {
            if (shippingFee !== undefined) settings.shippingFee = shippingFee;
            if (buyXGetCheapestFree !== undefined) settings.buyXGetCheapestFree = buyXGetCheapestFree;
            const updatedSettings = await settings.save();
            res.json(updatedSettings);
        } else {
            const newSettings = await Setting.create({
                shippingFee: shippingFee || 50,
                buyXGetCheapestFree: buyXGetCheapestFree || false,
            });
            res.status(201).json(newSettings);
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error updating settings" });
    }
};