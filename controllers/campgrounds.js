const Campground = require("../models/Campground");
const { cloudinary, storage } = require("../cloudinary/index");

module.exports.index = async (req, res, next) => {
	const campgrounds = await Campground.find({});
	res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
	res.render("campgrounds/new");
};

module.exports.createNewCampground = async (req, res, next) => {
	const newCampground = await new Campground(req.body.campground);
	newCampground.images = req.files.map((f) => ({
		url: f.path,
		filename: f.filename,
	}));
	newCampground.author = req.user._id;
	await newCampground.save();
	req.flash("success", "Successfully made a new campground!");
	res.redirect(`/campgrounds/${newCampground._id}`);
};

module.exports.showCampGround = async (req, res, next) => {
	const { id } = req.params;
	const campground = await Campground.findById(id)
		.populate({ path: "reviews", populate: { path: "author" } })
		.populate("author");
	res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res, next) => {
	const { id } = req.params;
	const campground = await Campground.findById(id);
	if (!campground) {
		req.flash("error", "Campground doesn't exist");
		return res.redirect("/campgrounds");
	}
	res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res, next) => {
	const { id } = req.params;
	const campground = await Campground.findByIdAndUpdate(id, {
		...req.body.campground,
	});
	if (!campground) {
		req.flash("error", "Campground doesn't exist");
		return res.redirect("/campgrounds");
	}
	const imgs = req.files.map((f) => ({
		url: f.path,
		filename: f.filename,
	}));
	campground.images.push(...imgs);
	if (req.body.deleteImages) {
		for (let filename of req.body.deleteImages) {
		}
		await campground.updateOne({
			$pull: { images: { filename: { $in: req.body.deleteImages } } },
		});
	}
	await campground.save();
	const updateCampground = await Campground.findById(id);
	req.flash("success", "Successfully updated campground!");
	res.render("campgrounds/show", { campground: updateCampground });
};

module.exports.deleteCampground = async (req, res, next) => {
	const { id } = req.params;
	await Campground.findByIdAndDelete(id);
	req.flash("success", "Successfully deleted campground");
	res.redirect("/campgrounds");
};
