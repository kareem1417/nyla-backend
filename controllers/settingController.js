import Setting from "../models/Setting.js";

export const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({ shippingFee: 50 });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Server Error fetching settings" });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { shippingFee } = req.body;
        let settings = await Setting.findOne();

        if (settings) {
            settings.shippingFee = shippingFee;
            const updatedSettings = await settings.save();
            res.json(updatedSettings);
        } else {
            const newSettings = await Setting.create({ shippingFee });
            res.status(201).json(newSettings);
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error updating settings" });
    }
};