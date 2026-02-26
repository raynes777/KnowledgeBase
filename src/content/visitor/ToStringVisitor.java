package content.visitor;

import content.IntegerContent;
import content.TranscludedContent;
import content.StringContent;

public class ToStringVisitor implements ContentVisitor<String> {

	@Override
	public String visitStringContent(StringContent c) {
		return c.show();
	}

	@Override
	public String visitTranscludedContent(TranscludedContent c) {
		return c.show().content().accept(this);
	}
	@Override
	public String visitIntegerContent(IntegerContent c) {
		return c.show().toString();
	}
	
	public static ToStringVisitor get() {
		return new ToStringVisitor();
	}
	

}
